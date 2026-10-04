'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Activity, AlertTriangle, Building2, CalendarClock, CheckCircle2, FlaskConical, Languages, Plus, Siren, Stamp, Users, XCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useCan, useClocks, useScopedStudies, useT } from '@/lib/hooks';
import { useCompliance } from '@/lib/compliance';
import { batchSignals } from '@/lib/analytics';
import { fmtDuration, type Clock } from '@/lib/rules';
import { Badge, Card, ClockPill, Kpi, PageHeader, Progress, ReadOnlyBanner, StudyStatusBadge, fmtDate, Modal } from '@/components/ui';
import { EChart } from '@/components/EChart';
import { SaeClockCard } from '@/components/Clocks';
import type { Deviation } from '@/lib/types';

export default function Dashboard() {
  const role = useStore((s) => s.role);
  if (role === 'investigator') return <InvestigatorDash />;
  if (role === 'ethics') return <EthicsDash />;
  if (role === 'pv') return <PvDash />;
  return <LeadershipDash />;
}

function worst(clocks: Clock[]) {
  const order = ['overdue', 'red', 'amber', 'green', 'met-late', 'met'] as const;
  return order.find((o) => clocks.some((c) => c.status === o));
}

function KpiTargets() {
  const { criteria, overall } = useCompliance();
  return (
    <Card title={<span>KPI targets · live compliance <span className="ml-2 text-xs font-normal text-slate-500">overall {overall}/100</span></span>} actions={<Link href="/scorecard" className="text-xs text-brand-700 hover:underline">Evidence →</Link>}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {criteria.map((c) => (
          <Link key={c.id} href="/scorecard" className={`rounded-lg border p-3 transition hover:shadow ${c.pass ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">{c.target}</span>
              {c.pass ? <CheckCircle2 size={16} className="text-emerald-600" /> : <XCircle size={16} className="text-red-600" />}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{c.title}</div>
            <div className="mt-1 flex items-end justify-between">
              <span className="text-xs text-slate-500">{c.headline}</span>
              <span className={`text-lg font-semibold tabular-nums ${c.pass ? 'text-emerald-700' : 'text-red-700'}`}>{c.score}</span>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function LeadershipDash() {
  const t = useT();
  const lang = useStore((s) => s.lang);
  const studies = useStore((s) => s.studies);
  const participants = useStore((s) => s.participants);
  const aes = useStore((s) => s.aes);
  const batches = useStore((s) => s.batches);
  const { clocks } = useClocks(1000);

  const active = studies.filter((s) => ['Recruiting', 'Active, not recruiting', 'Suspended'].includes(s.status));
  const siteSet = new Set(active.flatMap((s) => s.sites.map((x) => x.siteId)));
  const totalTarget = studies.reduce((a, s) => a + s.target, 0);
  const openSae = aes.filter((a) => a.serious && a.status !== 'Closed');
  const hot = clocks.filter((c) => c.status === 'red' || c.status === 'overdue');

  const enrolOpt = useMemo(() => ({
    tooltip: { trigger: 'axis' as const }, legend: { top: 0, data: ['Enrolled', 'Target'] }, grid: { left: 40, right: 10, top: 30, bottom: 30 },
    xAxis: { type: 'category' as const, data: studies.map((s) => s.id) },
    yAxis: { type: 'value' as const },
    series: [
      { name: 'Enrolled', type: 'bar' as const, data: studies.map((s) => participants.filter((p) => p.studyId === s.id).length), barMaxWidth: 22, itemStyle: { borderRadius: [4, 4, 0, 0] } },
      { name: 'Target', type: 'line' as const, data: studies.map((s) => s.target), symbol: 'diamond', lineStyle: { type: 'dashed' as const } },
    ],
  }), [studies, participants]);

  const trendOpt = useMemo(() => {
    const months = Array.from(new Set(studies.flatMap((s) => s.enrolmentHistory.map((h) => h.month)))).sort().slice(-14);
    const data = months.map((m) => studies.reduce((a, s) => { const h = [...s.enrolmentHistory].reverse().find((x) => x.month <= m); return a + (h?.cumulative ?? 0); }, 0));
    return { tooltip: { trigger: 'axis' as const }, grid: { left: 40, right: 10, top: 10, bottom: 30 }, xAxis: { type: 'category' as const, data: months }, yAxis: { type: 'value' as const }, series: [{ type: 'line' as const, smooth: true, data, areaStyle: { opacity: 0.15 }, name: 'Cumulative enrolment' }] };
  }, [studies]);

  const signals = useMemo(() => batchSignals(aes, batches), [aes, batches]);
  const batchOpt = useMemo(() => ({
    tooltip: { trigger: 'axis' as const }, grid: { left: 80, right: 20, top: 10, bottom: 20 },
    xAxis: { type: 'value' as const, name: 'AE / 100 exposed' }, yAxis: { type: 'category' as const, data: batches.map((b) => b.batchNo) },
    series: [{ type: 'bar' as const, data: signals.map((s) => ({ value: s.ratePer100, itemStyle: { color: s.signal ? '#c2410c' : '#4bb39c', borderRadius: [0, 4, 4, 0] } })), barMaxWidth: 18 }],
  }), [signals, batches]);

  return (
    <div>
      <PageHeader kicker="Leadership / Regulator" title={t('portfolio')} subtitle="Real-time, read-only, auditable view of the AIIA Ayurveda clinical trial portfolio." />
      <ReadOnlyBanner />
      <div id="tour-kpis" className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Kpi label={t('kpi_studies')} value={active.length} sub={`${studies.length} in registry`} icon={<FlaskConical size={16} />} />
          <Kpi label={t('kpi_enrolled')} value={participants.length} sub={`${Math.round((participants.length / totalTarget) * 100)}% of ${totalTarget} target`} icon={<Users size={16} />} />
          <Kpi label={t('kpi_sites')} value={siteSet.size} sub="AIIA + partner sites" icon={<Building2 size={16} />} />
          <Kpi label="Adverse events" value={aes.length} sub={`${aes.filter((a) => a.serious).length} serious`} icon={<Activity size={16} />} tone="slate" />
          <Kpi label={t('kpi_saes')} value={openSae.length} sub="awaiting closure" icon={<Siren size={16} />} tone="amber" />
          <Kpi label="Critical clocks" value={hot.length} sub={hot.length ? 'red / overdue — escalated' : 'all on track'} icon={<AlertTriangle size={16} />} tone={hot.length ? 'red' : 'green'} />
        </div>
        <KpiTargets />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="Enrolment vs target by study" className="xl:col-span-2"><EChart option={enrolOpt} height={260} /></Card>
        <Card title="Critical statutory clocks" actions={<Link href="/safety" className="text-xs text-brand-700 hover:underline">All clocks →</Link>} bodyClass="divide-y divide-slate-100">
          {hot.length === 0 && <div className="p-4 text-sm text-slate-500">No red or overdue clocks.</div>}
          {hot.slice(0, 5).map((c) => (
            <Link key={c.key} href={c.appliesTo === 'SAE' ? `/safety?focus=${c.entityId}` : `/studies/${c.studyId}`} className="flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-slate-50">
              <div className="min-w-0"><div className="truncate text-sm font-medium">{c.label}</div><div className="text-[11px] text-slate-500">{c.ruleId} · escalated to {c.ladder[c.escalationIndex].label}</div></div>
              <div className="text-right"><ClockPill status={c.status} pulse /><div className="mt-0.5 font-mono text-xs tabular-nums text-red-600">{fmtDuration(c.remainingMs)}</div></div>
            </Link>
          ))}
        </Card>
        <Card title="Portfolio cumulative enrolment"><EChart option={trendOpt} height={220} /></Card>
        <Card title="AE rate by formulation batch" actions={<Link href="/batches" className="text-xs text-brand-700 hover:underline">Signals →</Link>}><EChart option={batchOpt} height={220} /></Card>
        <Card title="Clock status mix">
          <EChart height={220} option={{ tooltip: { trigger: 'item' }, series: [{ type: 'pie', radius: ['45%', '72%'], label: { fontSize: 11 }, data: (['green', 'amber', 'red', 'overdue', 'met'] as const).map((s) => ({ name: s, value: clocks.filter((c) => c.status === s).length, itemStyle: { color: { green: '#10b981', amber: '#f59e0b', red: '#ef4444', overdue: '#991b1b', met: '#94a3b8' }[s] } })) }] }} />
        </Card>
      </div>

      <Card title="Study registry" className="mt-4" bodyClass="overflow-x-auto" actions={<Link href="/studies" className="text-xs text-brand-700 hover:underline">Open registry →</Link>}>
        <table className="tbl">
          <thead><tr><th>Study</th><th>{t('phase')}</th><th>{t('status')}</th><th className="w-48">{t('enrolment')}</th><th>CTRI</th><th>EC valid until</th><th>Clocks</th></tr></thead>
          <tbody>
            {studies.map((s) => {
              const n = participants.filter((p) => p.studyId === s.id).length;
              const w = worst(clocks.filter((c) => c.studyId === s.id));
              return (
                <tr key={s.id}>
                  <td><Link href={`/studies/${s.id}`} className="font-medium text-brand-800 hover:underline">{s.id} · {lang === 'hi' ? s.titleHi : s.title}</Link><div className="text-[11px] text-slate-500">{s.ayurvedaCondition} · {s.sites.length} sites</div></td>
                  <td className="whitespace-nowrap text-xs">{s.phase}</td>
                  <td><StudyStatusBadge status={s.status} /></td>
                  <td><div className="mb-1 text-xs tabular-nums">{n}/{s.target}</div><Progress value={n} max={s.target} /></td>
                  <td className="mono whitespace-nowrap">{s.ctriNo}</td>
                  <td className="whitespace-nowrap text-xs">{fmtDate(s.ecExpiryDate)}</td>
                  <td>{w ? <ClockPill status={w} /> : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function InvestigatorDash() {
  const studies = useScopedStudies();
  const lang = useStore((s) => s.lang);
  const participants = useStore((s) => s.participants);
  const visits = useStore((s) => s.visits);
  const deviations = useStore((s) => s.deviations);
  const aes = useStore((s) => s.aes);
  const { clocks, now } = useClocks(1000);
  const ids = new Set(studies.map((s) => s.id));
  const myClocks = clocks.filter((c) => ids.has(c.studyId) && c.appliesTo === 'SAE' && !c.stoppedAt && c.ruleId === 'SAE-24H');
  const upcoming = visits.filter((v) => ids.has(v.studyId) && v.status === 'Scheduled' && Date.parse(v.scheduled) < now + 14 * 86400000).sort((a, b) => a.scheduled.localeCompare(b.scheduled));
  const myDevs = deviations.filter((d) => ids.has(d.studyId));
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader kicker="Investigator" title="My studies" subtitle="Enrolment, visits and protocol deviations for the studies you are responsible for."
        actions={<><Link href="/capture" className="btn-primary"><Plus size={14} /> New site entry</Link></>} />
      <div className="grid gap-4 md:grid-cols-2">
        {studies.map((s) => {
          const n = participants.filter((p) => p.studyId === s.id).length;
          const screening = Math.round(n * 1.6);
          return (
            <Card key={s.id} title={<Link href={`/studies/${s.id}`} className="hover:underline">{s.id} · {lang === 'hi' ? s.titleHi : s.title}</Link>} actions={<StudyStatusBadge status={s.status} />}>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[['Screened', screening], ['Enrolled', n], ['Target', s.target], ['Open AEs', aes.filter((a) => a.studyId === s.id && a.status !== 'Closed').length]].map(([l, v]) => (
                  <div key={l as string} className="rounded-lg bg-slate-50 p-2"><div className="text-lg font-semibold tabular-nums">{v}</div><div className="text-[11px] text-slate-500">{l}</div></div>
                ))}
              </div>
              <div className="mt-3"><Progress value={n} max={s.target} /></div>
              <div className="mt-2 text-xs text-slate-500">CTRI {s.ctriNo} · EC valid until {fmtDate(s.ecExpiryDate)}</div>
            </Card>
          );
        })}
      </div>
      {myClocks.length > 0 && <div className="mt-4 space-y-3">{myClocks.map((c) => <SaeClockCard key={c.key} clock={c} />)}</div>}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title={<span className="flex items-center gap-2"><CalendarClock size={15} /> Upcoming visits (14 days)</span>} bodyClass="max-h-80 overflow-y-auto">
          <table className="tbl"><thead><tr><th>Participant</th><th>Visit</th><th>Due</th></tr></thead>
            <tbody>{upcoming.slice(0, 30).map((v) => <tr key={v.id}><td className="mono">{v.participantId}</td><td>{v.visitName}</td><td className="text-xs">{fmtDate(v.scheduled)}</td></tr>)}
              {!upcoming.length && <tr><td colSpan={3} className="text-slate-500">No visits due.</td></tr>}</tbody></table>
        </Card>
        <Card title="Protocol deviations" actions={<button className="btn-ghost text-xs" onClick={() => setOpen(true)}><Plus size={13} /> Log deviation</button>} bodyClass="max-h-80 overflow-y-auto">
          <table className="tbl"><thead><tr><th>ID</th><th>Category</th><th>Participant</th><th>Severity</th><th>Status</th></tr></thead>
            <tbody>{myDevs.map((d) => <tr key={d.id}><td className="mono">{d.id}</td><td className="text-xs">{d.category}<div className="text-[11px] text-slate-500">{d.description}</div></td><td className="mono">{d.participantId}</td><td><Badge tone={d.severity === 'Major' ? 'red' : 'amber'}>{d.severity}</Badge></td><td className="text-xs">{d.status}</td></tr>)}</tbody></table>
        </Card>
      </div>
      <DeviationModal open={open} onClose={() => setOpen(false)} studyIds={studies.map((s) => s.id)} />
    </div>
  );
}

function DeviationModal({ open, onClose, studyIds }: { open: boolean; onClose: () => void; studyIds: string[] }) {
  const allP = useStore((s) => s.participants);
  const participants = useMemo(() => allP.filter((p) => studyIds.includes(p.studyId)), [allP, studyIds]);
  const add = useStore((s) => s.addDeviation);
  const canAdd = useCan('deviation:create');
  const [pid, setPid] = useState('');
  const [cat, setCat] = useState<Deviation['category']>('Visit window');
  const [sev, setSev] = useState<Deviation['severity']>('Minor');
  const [desc, setDesc] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Log protocol deviation">
      <div className="space-y-3">
        <div><label className="label">Participant</label><select className="input" value={pid} onChange={(e) => setPid(e.target.value)}><option value="">Select…</option>{participants.map((p) => <option key={p.id}>{p.id}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">Category</label><select className="input" value={cat} onChange={(e) => setCat(e.target.value as Deviation['category'])}>{['Visit window', 'Eligibility', 'IP dosing', 'Consent', 'Lab missed'].map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="label">Severity</label><select className="input" value={sev} onChange={(e) => setSev(e.target.value as Deviation['severity'])}><option>Minor</option><option>Major</option></select></div>
        </div>
        <div><label className="label">Description</label><textarea className="input" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!canAdd || !pid || desc.length < 5} onClick={() => { const p = participants.find((x) => x.id === pid)!; add({ studyId: p.studyId, siteId: p.siteId, participantId: p.id, category: cat, description: desc, severity: sev, reportedOn: new Date().toISOString().slice(0, 10), status: 'Open' }); setDesc(''); setPid(''); onClose(); }}>Save (audited)</button></div>
      </div>
    </Modal>
  );
}

function EthicsDash() {
  const studies = useStore((s) => s.studies);
  const participants = useStore((s) => s.participants);
  const { clocks } = useClocks(1000);
  const renewals = clocks.filter((c) => c.ruleId === 'EC-RENEWAL').sort((a, b) => a.dueAt - b.dueAt);
  const opinions = clocks.filter((c) => c.ruleId === 'SAE-EC-30D' && !c.stoppedAt);
  const pending = studies.filter((s) => s.ecRenewalStatus === 'Pending initial');
  const reconsent = participants.filter((p) => p.consentStatus === 'Re-consent required').length;
  return (
    <div>
      <PageHeader kicker="Ethics Committee" title="Approvals & renewals" subtitle="Every approval, renewal and SAE opinion tracked to its due date." actions={<Link href="/ethics" className="btn-primary"><Stamp size={14} /> Open EC workspace</Link>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Renewals due ≤ 60 days" value={renewals.filter((c) => !c.stoppedAt && c.remainingMs < 60 * 86400000).length} tone="amber" />
        <Kpi label="SAE opinions pending" value={opinions.length} tone={opinions.some((o) => o.status === 'red' || o.status === 'overdue') ? 'red' : 'brand'} />
        <Kpi label="Initial approvals pending" value={pending.length} tone="slate" />
        <Kpi label="Participants needing re-consent" value={reconsent} tone="amber" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="Renewal timeline (by due date)" bodyClass="divide-y divide-slate-100">
          {renewals.map((c) => {
            const s = studies.find((x) => x.id === c.studyId)!;
            return (
              <div key={c.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0"><div className="truncate text-sm font-medium">{s.id} · {s.title}</div><div className="text-[11px] text-slate-500">{s.ecName} · approved {fmtDate(s.ecApprovalDate)} · expires {fmtDate(s.ecExpiryDate)}</div></div>
                <div className="text-right"><ClockPill status={c.status} /><div className="mt-0.5 text-[11px] tabular-nums text-slate-500">{c.stoppedAt ? s.ecRenewalStatus : `${Math.round(c.remainingMs / 86400000)} days`}</div></div>
              </div>
            );
          })}
        </Card>
        <Card title="SAE opinions due (30-day clock)" bodyClass="space-y-3 p-4">
          {opinions.length === 0 && <div className="text-sm text-slate-500">No pending SAE opinions.</div>}
          {opinions.map((c) => <SaeClockCard key={c.key} clock={c} />)}
        </Card>
      </div>
    </div>
  );
}

function PvDash() {
  const aes = useStore((s) => s.aes);
  const batches = useStore((s) => s.batches);
  const { clocks } = useClocks(1000);
  const open24 = clocks.filter((c) => c.ruleId === 'SAE-24H' && !c.stoppedAt).sort((a, b) => a.remainingMs - b.remainingMs);
  const open14 = clocks.filter((c) => c.ruleId === 'SAE-14D' && !c.stoppedAt);
  const queue = aes.filter((a) => a.codingStatus !== 'Coded');
  const signals = useMemo(() => batchSignals(aes, batches).filter((s) => s.signal), [aes, batches]);
  const socOpt = useMemo(() => {
    const m: Record<string, number> = {};
    aes.forEach((a) => { const k = a.meddraSOC ?? 'Uncoded'; m[k] = (m[k] ?? 0) + 1; });
    const e = Object.entries(m).sort((a, b) => a[1] - b[1]);
    return { tooltip: {}, grid: { left: 210, right: 20, top: 10, bottom: 20 }, xAxis: { type: 'value' as const }, yAxis: { type: 'category' as const, data: e.map((x) => x[0]), axisLabel: { fontSize: 10 } }, series: [{ type: 'bar' as const, data: e.map((x) => x[1]), barMaxWidth: 14, itemStyle: { borderRadius: [0, 4, 4, 0] } }] };
  }, [aes]);
  return (
    <div>
      <PageHeader kicker="Pharmacovigilance" title="Safety command centre" subtitle="SAE clocks, coding queue and batch signals in one place." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="24-h SAE clocks running" value={open24.length} tone={open24.some((c) => c.status === 'overdue' || c.status === 'red') ? 'red' : 'amber'} icon={<Siren size={16} />} />
        <Kpi label="14-day analyses open" value={open14.length} />
        <Link href="/coding"><Kpi label="Coding queue" value={queue.length} sub="NAMASTE → MedDRA" icon={<Languages size={16} />} tone="slate" /></Link>
        <Link href="/batches"><Kpi label="Batch signals" value={signals.length} sub={signals.map((s) => s.batchId).join(', ') || 'none'} tone={signals.length ? 'red' : 'green'} icon={<AlertTriangle size={16} />} /></Link>
      </div>
      <div className="mt-4 space-y-3">{open24.map((c) => <SaeClockCard key={c.key} clock={c} />)}</div>
      <Card title="AEs by MedDRA SOC" className="mt-4"><EChart option={socOpt} height={300} /></Card>
    </div>
  );
}
