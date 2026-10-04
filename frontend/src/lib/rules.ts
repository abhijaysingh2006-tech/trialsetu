// Configurable statutory-clock & rule engine.
// Rules are data (editable on /rules, persisted, audit-logged). The evaluator is a pure
// function so it can run identically in the browser (mock) or in the FastAPI worker
// (Redis-queued escalations) — see backend/app/rules.py.

import type { AdverseEvent, RoleId, Study } from './types';

export type ClockStatus = 'green' | 'amber' | 'red' | 'overdue' | 'met' | 'met-late';

export interface EscalationStep {
  atPctElapsed: number; // 0..1.0+ (1.0 = due)
  role: RoleId | 'pi';
  label: string;
}

export interface ClockRule {
  id: string;
  name: string;
  appliesTo: 'SAE' | 'EC' | 'CTRI';
  legalBasis: string;
  startEvent: string;
  stopEvent: string;
  durationHours: number; // ignored when the due date comes from the record (EC expiry)
  amberWithinHours: number;
  redWithinHours: number;
  enabled: boolean;
  escalation: EscalationStep[];
}

export const STANDARD_LADDER: EscalationStep[] = [
  { atPctElapsed: 0, role: 'investigator', label: 'Site Investigator' },
  { atPctElapsed: 0.5, role: 'pv', label: 'PV Officer' },
  { atPctElapsed: 0.75, role: 'pi', label: 'Principal Investigator' },
  { atPctElapsed: 0.9, role: 'leadership', label: 'Leadership / Regulator desk' },
];

export const DEFAULT_RULES: ClockRule[] = [
  {
    id: 'SAE-24H', name: 'SAE initial report to CLA, Sponsor & Ethics Committee', appliesTo: 'SAE',
    legalBasis: 'NDCT Rules 2019 — SAE reporting by investigator within 24 h of occurrence/awareness (Third Schedule)',
    startEvent: 'Investigator becomes aware of SAE', stopEvent: 'Initial SAE report submitted',
    durationHours: 24, amberWithinHours: 8, redWithinHours: 2, enabled: true, escalation: STANDARD_LADDER,
  },
  {
    id: 'SAE-14D', name: 'SAE report after due analysis', appliesTo: 'SAE',
    legalBasis: 'NDCT Rules 2019 — analysed SAE report to CLA, Chairperson of EC & head of institution within 14 days',
    startEvent: 'Investigator becomes aware of SAE', stopEvent: 'Analysis report submitted',
    durationHours: 14 * 24, amberWithinHours: 96, redWithinHours: 24, enabled: true, escalation: STANDARD_LADDER,
  },
  {
    id: 'SAE-EC-30D', name: 'Ethics Committee opinion on SAE (incl. compensation)', appliesTo: 'SAE',
    legalBasis: 'NDCT Rules 2019 — EC to forward its report/opinion on SAE to CLA within 30 days of receipt',
    startEvent: 'Initial SAE report received by EC', stopEvent: 'EC opinion recorded',
    durationHours: 30 * 24, amberWithinHours: 7 * 24, redWithinHours: 2 * 24, enabled: true,
    escalation: [
      { atPctElapsed: 0, role: 'ethics', label: 'EC Member Secretary' },
      { atPctElapsed: 0.75, role: 'pv', label: 'PV Officer' },
      { atPctElapsed: 0.9, role: 'leadership', label: 'Leadership / Regulator desk' },
    ],
  },
  {
    id: 'EC-RENEWAL', name: 'Ethics approval continuing review / renewal', appliesTo: 'EC',
    legalBasis: 'NDCT Rules 2019 & ICMR National Ethical Guidelines 2017 — periodic review at EC-defined interval (default 12 months)',
    startEvent: 'EC approval date', stopEvent: 'Renewal submitted / approved',
    durationHours: 365 * 24, amberWithinHours: 60 * 24, redWithinHours: 15 * 24, enabled: true,
    escalation: [
      { atPctElapsed: 0, role: 'investigator', label: 'Principal Investigator' },
      { atPctElapsed: 0.85, role: 'ethics', label: 'EC Member Secretary' },
      { atPctElapsed: 0.96, role: 'leadership', label: 'Leadership / Regulator desk' },
    ],
  },
  {
    id: 'CTRI-PERIODIC', name: 'CTRI record periodic update', appliesTo: 'CTRI',
    legalBasis: 'CTRI registration requirement (NDCT Rules 2019) + AIIA SOP: refresh record every 6 months',
    startEvent: 'Last CTRI update', stopEvent: 'CTRI record updated',
    durationHours: 180 * 24, amberWithinHours: 30 * 24, redWithinHours: 7 * 24, enabled: true,
    escalation: [
      { atPctElapsed: 0, role: 'investigator', label: 'Principal Investigator' },
      { atPctElapsed: 0.9, role: 'leadership', label: 'Research Cell' },
    ],
  },
  {
    id: 'CTRI-STATUS', name: 'CTRI update after trial status change', appliesTo: 'CTRI',
    legalBasis: 'AIIA SOP (configurable): reflect recruitment status changes on CTRI within 30 days',
    startEvent: 'Trial status change', stopEvent: 'CTRI record updated',
    durationHours: 30 * 24, amberWithinHours: 10 * 24, redWithinHours: 3 * 24, enabled: true,
    escalation: [
      { atPctElapsed: 0, role: 'investigator', label: 'Principal Investigator' },
      { atPctElapsed: 0.8, role: 'leadership', label: 'Research Cell' },
    ],
  },
];

export interface Clock {
  key: string;
  ruleId: string;
  ruleName: string;
  appliesTo: ClockRule['appliesTo'];
  entityId: string; // AE id or study id
  studyId: string;
  label: string;
  startAt: number;
  dueAt: number;
  stoppedAt?: number;
  status: ClockStatus;
  remainingMs: number;
  pctElapsed: number;
  escalationIndex: number;
  ladder: EscalationStep[];
}

function statusFor(rule: ClockRule, now: number, due: number, stopped?: number): ClockStatus {
  if (stopped !== undefined) return stopped <= due ? 'met' : 'met-late';
  const rem = due - now;
  if (rem < 0) return 'overdue';
  if (rem <= rule.redWithinHours * 3_600_000) return 'red';
  if (rem <= rule.amberWithinHours * 3_600_000) return 'amber';
  return 'green';
}

function build(rule: ClockRule, now: number, entityId: string, studyId: string, label: string, start: number, due: number, stopped?: number): Clock {
  const ref = stopped ?? now;
  const pct = Math.max(0, (ref - start) / Math.max(1, due - start));
  let idx = 0;
  rule.escalation.forEach((s, i) => { if (pct >= s.atPctElapsed) idx = i; });
  const status = statusFor(rule, now, due, stopped);
  if (status === 'overdue') idx = rule.escalation.length - 1;
  return {
    key: `${rule.id}:${entityId}`, ruleId: rule.id, ruleName: rule.name, appliesTo: rule.appliesTo,
    entityId, studyId, label, startAt: start, dueAt: due, stoppedAt: stopped, status,
    remainingMs: due - now, pctElapsed: pct, escalationIndex: idx, ladder: rule.escalation,
  };
}

export function evaluateClocks(rules: ClockRule[], aes: AdverseEvent[], studies: Study[], now: number): Clock[] {
  const out: Clock[] = [];
  const H = 3_600_000;
  const r = Object.fromEntries(rules.map((x) => [x.id, x]));
  for (const ae of aes) {
    if (!ae.serious) continue;
    const aware = Date.parse(ae.awareAt);
    const lbl = `${ae.id} · ${ae.meddraPT ?? ae.verbatim}`;
    if (r['SAE-24H']?.enabled) {
      const rule = r['SAE-24H'];
      out.push(build(rule, now, ae.id, ae.studyId, lbl, aware, aware + rule.durationHours * H, ae.reportedAt ? Date.parse(ae.reportedAt) : undefined));
    }
    if (r['SAE-14D']?.enabled) {
      const rule = r['SAE-14D'];
      out.push(build(rule, now, ae.id, ae.studyId, lbl, aware, aware + rule.durationHours * H, ae.analysisReportedAt ? Date.parse(ae.analysisReportedAt) : undefined));
    }
    if (r['SAE-EC-30D']?.enabled && ae.reportedAt) {
      const rule = r['SAE-EC-30D'];
      const st = Date.parse(ae.reportedAt);
      out.push(build(rule, now, ae.id, ae.studyId, lbl, st, st + rule.durationHours * H, ae.ecOpinionAt ? Date.parse(ae.ecOpinionAt) : undefined));
    }
  }
  for (const s of studies) {
    if (s.status === 'Completed') continue;
    const rule = r['EC-RENEWAL'];
    if (rule?.enabled && s.ecExpiryDate) {
      const stopped = s.ecRenewalStatus === 'Renewal submitted' ? now - 1 : undefined;
      out.push(build(rule, now, s.id, s.id, `${s.code} · EC renewal`, Date.parse(s.ecApprovalDate), Date.parse(s.ecExpiryDate), stopped));
    }
    const cp = r['CTRI-PERIODIC'];
    if (cp?.enabled) {
      const st = Date.parse(s.ctriLastUpdated);
      out.push(build(cp, now, s.id, s.id, `${s.code} · ${s.ctriNo}`, st, st + cp.durationHours * H));
    }
    const cs = r['CTRI-STATUS'];
    if (cs?.enabled && s.ctriStatusChangedOn) {
      const st = Date.parse(s.ctriStatusChangedOn);
      const upd = Date.parse(s.ctriLastUpdated);
      out.push(build(cs, now, s.id, s.id, `${s.code} · status → ${s.status}`, st, st + cs.durationHours * H, upd >= st ? upd : undefined));
    }
  }
  return out;
}

export const STATUS_STYLE: Record<ClockStatus, { label: string; cls: string; dot: string }> = {
  green: { label: 'On track', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  amber: { label: 'Due soon', cls: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  red: { label: 'Critical', cls: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
  overdue: { label: 'Overdue', cls: 'bg-red-600 text-white ring-red-700', dot: 'bg-white' },
  met: { label: 'Met', cls: 'bg-slate-50 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
  'met-late': { label: 'Met (late)', cls: 'bg-orange-50 text-orange-700 ring-orange-200', dot: 'bg-orange-500' },
};

export function fmtDuration(ms: number): string {
  const neg = ms < 0;
  let s = Math.floor(Math.abs(ms) / 1000);
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const core = d > 0 ? `${d}d ${pad(h)}h ${pad(m)}m` : `${pad(h)}:${pad(m)}:${pad(s)}`;
  return neg ? `-${core}` : core;
}
