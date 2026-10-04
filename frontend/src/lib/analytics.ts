// Explainable, human-in-the-loop analytics. Deliberately simple models so every output
// carries a plain-language "why". Nothing here auto-acts: users accept/dismiss.

import type { AdverseEvent, Batch, Participant, Study, Visit } from './types';

const DAY = 86_400_000;

export interface Forecast {
  studyId: string;
  current: number;
  target: number;
  ratePerMonth: number;
  requiredRate: number;
  projectedDate: string | null;
  plannedEnd: string;
  lagMonths: number | null;
  risk: 'On track' | 'At risk' | 'Off track' | 'Closed';
  why: string;
  series: { month: string; actual?: number; projected?: number }[];
}

export function forecastEnrolment(s: Study, now: number): Forecast {
  const hist = s.enrolmentHistory;
  const current = hist.length ? hist[hist.length - 1].cumulative : 0;
  const base = { studyId: s.id, current, target: s.target, plannedEnd: s.plannedEndDate };
  if (s.status !== 'Recruiting') {
    return { ...base, ratePerMonth: 0, requiredRate: 0, projectedDate: null, lagMonths: null, risk: 'Closed', why: `Not recruiting (status: ${s.status}); forecast not applicable.`, series: hist.map((h) => ({ month: h.month, actual: h.cumulative })) };
  }
  // Least-squares slope over the last ≤6 monthly points
  const pts = hist.slice(-6).map((h, i) => [i, h.cumulative] as const);
  const n = pts.length;
  const mx = pts.reduce((a, p) => a + p[0], 0) / n;
  const my = pts.reduce((a, p) => a + p[1], 0) / n;
  const num = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0);
  const den = pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0) || 1;
  const rate = Math.max(0.1, num / den);
  const remaining = Math.max(0, s.target - current);
  const monthsLeft = Math.max(0.5, (Date.parse(s.plannedEndDate) - now) / (30 * DAY) - 2); // keep 2 months for follow-up
  const required = remaining / monthsLeft;
  const monthsNeeded = remaining / rate;
  const projected = now + monthsNeeded * 30 * DAY;
  const lag = (projected - (Date.parse(s.plannedEndDate) - 60 * DAY)) / (30 * DAY);
  const risk: Forecast['risk'] = lag <= 0 ? 'On track' : lag <= 2 ? 'At risk' : 'Off track';
  const series: Forecast['series'] = hist.map((h) => ({ month: h.month, actual: h.cumulative }));
  let c = current;
  const d = new Date(now);
  for (let k = 1; k <= 12 && c < s.target; k++) {
    c = Math.min(s.target, c + rate);
    const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + k, 1)).toISOString().slice(0, 7);
    series.push({ month: m, projected: Math.round(c) });
  }
  if (series.length > hist.length && hist.length) series[hist.length - 1].projected = current;
  return {
    ...base, series, ratePerMonth: Math.round(rate * 10) / 10, requiredRate: Math.round(required * 10) / 10,
    projectedDate: new Date(projected).toISOString().slice(0, 10), lagMonths: Math.round(lag * 10) / 10, risk,
    why: `Linear trend over last ${n} months = ${rate.toFixed(1)} participants/month; ${remaining} still needed in ${monthsLeft.toFixed(1)} months (last-patient-in deadline) ⇒ requires ${required.toFixed(1)}/month. ${risk === 'On track' ? 'Current pace is sufficient.' : `Projected shortfall ≈ ${lag.toFixed(1)} months — consider activating additional sites or easing screening bottlenecks.`}`,
  };
}

export interface Anomaly {
  key: string;
  kind: 'Lab' | 'Unit error' | 'Visit window' | 'Digit preference';
  severity: 'High' | 'Medium' | 'Low';
  studyId: string;
  subject: string; // participant or site
  title: string;
  why: string;
}

export function detectAnomalies(visits: Visit[], participants: Participant[], batches: Batch[]): Anomaly[] {
  const out: Anomaly[] = [];
  const pMap = new Map(participants.map((p) => [p.id, p]));
  const bMap = new Map(batches.map((b) => [b.id, b]));
  const ULN = 40;
  const byP = new Map<string, Visit[]>();
  visits.forEach((v) => { if (!byP.has(v.participantId)) byP.set(v.participantId, []); byP.get(v.participantId)!.push(v); });

  byP.forEach((vs, pid) => {
    const p = pMap.get(pid)!;
    vs.forEach((v, i) => {
      if (v.alt !== undefined && v.alt > 3 * ULN) {
        const b = p.batchId ? bMap.get(p.batchId) : undefined;
        out.push({ key: `alt:${v.id}`, kind: 'Lab', severity: v.alt > 5 * ULN ? 'High' : 'Medium', studyId: v.studyId, subject: pid,
          title: `ALT ${v.alt} U/L at ${v.visitName}`,
          why: `ALT = ${(v.alt / ULN).toFixed(1)}× ULN (${ULN} U/L) — exceeds 3× ULN hepatotoxicity threshold; baseline ${vs[0].alt ?? '—'} U/L.${b ? ` Participant received batch ${b.batchNo}.` : ''} Check for matching AE report.` });
      }
      const prev = vs[i - 1];
      if (prev?.weight && v.weight && Math.abs(v.weight - prev.weight) / prev.weight > 0.1) {
        const ratio = v.weight / prev.weight;
        out.push({ key: `wt:${v.id}`, kind: 'Unit error', severity: 'Medium', studyId: v.studyId, subject: pid,
          title: `Weight ${prev.weight} → ${v.weight} kg (${prev.visitName} → ${v.visitName})`,
          why: `Change of ${((ratio - 1) * 100).toFixed(0)}% in ≤8 weeks is physiologically implausible.${Math.abs(ratio - 2.2) < 0.15 ? ' Ratio ≈ 2.2 matches pounds entered as kilograms.' : ''} Raise a data query to the site.` });
      }
      if (v.actual && i > 0) {
        const dev = Math.round((Date.parse(v.actual) - Date.parse(v.scheduled)) / DAY);
        if (Math.abs(dev) > 3) out.push({ key: `win:${v.id}`, kind: 'Visit window', severity: 'Low', studyId: v.studyId, subject: pid,
          title: `${v.visitName} done ${dev > 0 ? '+' : ''}${dev} days from schedule`,
          why: `Protocol window is ±3 days; actual ${v.actual} vs scheduled ${v.scheduled}. Likely protocol deviation — confirm and log PD.` });
      }
    });
  });

  // Site-level digit preference on SBP (terminal digit 0 expected ≈10%)
  const bySite = new Map<string, { n: number; zero: number; studies: Set<string> }>();
  visits.forEach((v) => {
    if (v.sbp === undefined) return;
    const site = pMap.get(v.participantId)!.siteId;
    const r = bySite.get(site) ?? { n: 0, zero: 0, studies: new Set() };
    r.n++; if (v.sbp % 10 === 0) r.zero++; r.studies.add(v.studyId);
    bySite.set(site, r);
  });
  bySite.forEach((r, site) => {
    const share = r.zero / r.n;
    if (r.n >= 30 && share > 0.35) {
      out.push({ key: `dig:${site}`, kind: 'Digit preference', severity: 'Medium', studyId: Array.from(r.studies)[0], subject: site,
        title: `Site ${site}: ${(share * 100).toFixed(0)}% of systolic BP values end in 0`,
        why: `Expected ≈10% for a uniform terminal digit; observed ${r.zero}/${r.n}. Suggests rounding / non-calibrated sphygmomanometer — recommend site retraining and digital BP device.` });
    }
  });
  const rank = { High: 0, Medium: 1, Low: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export interface BatchSignal {
  batchId: string;
  exposed: number;
  aeCount: number;
  saeCount: number;
  ratePer100: number;
  topSOC: string;
  topSOCCount: number;
  prr: number;
  chi2: number;
  signal: boolean;
  why: string;
  socCounts: Record<string, number>;
}

/** Disproportionality (PRR, Evans criteria: PRR≥2, χ²≥4, n≥3) of each batch vs all other batches. */
export function batchSignals(aes: AdverseEvent[], batches: Batch[]): BatchSignal[] {
  const linked = aes.filter((a) => a.batchId);
  const socOf = (a: AdverseEvent) => a.meddraSOC ?? 'Uncoded';
  return batches.map((b) => {
    const mine = linked.filter((a) => a.batchId === b.id);
    const others = linked.filter((a) => a.batchId !== b.id);
    const socCounts: Record<string, number> = {};
    mine.forEach((a) => { socCounts[socOf(a)] = (socCounts[socOf(a)] ?? 0) + 1; });
    // Group hepatic signal: Hepatobiliary + Investigations (LFT) as clinically related
    const isHep = (a: AdverseEvent) => ['Hepatobiliary disorders', 'Investigations'].includes(socOf(a)) || /liver|jaundice|alt|kamala/i.test(a.verbatim + (a.namasteTerm ?? ''));
    const top = Object.entries(socCounts).sort((x, y) => y[1] - x[1])[0] ?? ['—', 0];
    const a = mine.filter(isHep).length, bb = mine.length - a;
    const c = others.filter(isHep).length, d = others.length - c;
    const prr = a === 0 ? 0 : (a / Math.max(1, a + bb)) / Math.max(1e-6, c / Math.max(1, c + d));
    const N = a + bb + c + d;
    const exp = ((a + bb) * (a + c)) / Math.max(1, N);
    const chi2 = exp > 0 ? ((Math.abs(a - exp) - 0.5) ** 2) / exp : 0;
    const signal = prr >= 2 && chi2 >= 4 && a >= 3;
    const rate = b.unitsDispensed ? (mine.length / b.unitsDispensed) * 100 : 0;
    return {
      batchId: b.id, exposed: b.unitsDispensed, aeCount: mine.length, saeCount: mine.filter((x) => x.serious).length,
      ratePer100: Math.round(rate * 10) / 10, topSOC: top[0], topSOCCount: top[1] as number,
      prr: Math.round(prr * 100) / 100, chi2: Math.round(chi2 * 10) / 10, signal, socCounts,
      why: signal
        ? `Hepatic/LFT events: ${a} of ${mine.length} AEs on this batch vs ${c} of ${others.length} on all other batches ⇒ PRR ${prr.toFixed(1)} (χ² ${chi2.toFixed(1)}). Meets Evans criteria (PRR≥2, χ²≥4, n≥3). AE rate ${rate.toFixed(0)} per 100 exposed.`
        : `Hepatic/LFT events ${a}/${mine.length}; PRR ${prr.toFixed(1)}, χ² ${chi2.toFixed(1)} — below signal threshold. AE rate ${rate.toFixed(0)} per 100 exposed.`,
    };
  });
}
