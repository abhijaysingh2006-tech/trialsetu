'use client';

import Link from 'next/link';
import { useState, memo } from 'react';
import { ArrowRight, Boxes, Check, PenLine, Send, Timer } from 'lucide-react';
import { fmtDuration, type Clock } from '@/lib/rules';
import { useStore } from '@/lib/store';
import { useCan } from '@/lib/hooks';
import type { ESignature } from '@/lib/types';
import { ClockPill, Modal, fmtDT } from './ui';

export const EscalationLadder = memo(function EscalationLadder({ clock }: { clock: Clock }) {
  return (
    <ol className="flex flex-wrap items-center gap-1 text-[11px]">
      {clock.ladder.map((s, i) => {
        const reached = i <= clock.escalationIndex && !clock.stoppedAt;
        const current = i === clock.escalationIndex && !clock.stoppedAt;
        return (
          <li key={i} className="flex items-center gap-1">
            <span className={`rounded-md px-1.5 py-0.5 ring-1 ${current ? 'bg-red-600 text-white ring-red-700' : reached ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-slate-50 text-slate-500 ring-slate-200'}`} title={`Notified at ${Math.round(s.atPctElapsed * 100)}% of window`}>
              {s.label} <span className="opacity-60">{Math.round(s.atPctElapsed * 100)}%</span>
            </span>
            {i < clock.ladder.length - 1 && <ArrowRight size={10} className="text-slate-300" />}
          </li>
        );
      })}
    </ol>
  );
});

export const ClockBar = memo(function ClockBar({ clock }: { clock: Clock }) {
  const pct = Math.min(100, clock.pctElapsed * 100);
  const c = clock.stoppedAt ? 'bg-slate-400' : clock.status === 'green' ? 'bg-emerald-500' : clock.status === 'amber' ? 'bg-amber-500' : 'bg-red-600';
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full ${c}`} style={{ width: `${pct}%` }} />
      {clock.ladder.map((s, i) => <span key={i} className="absolute top-0 h-full w-px bg-white/80" style={{ left: `${s.atPctElapsed * 100}%` }} />)}
    </div>
  );
});

/** Large SAE countdown card with escalation ladder and the statutory action. */
export const SaeClockCard = memo(function SaeClockCard({ clock, highlight }: { clock: Clock; highlight?: boolean }) {
  const ae = useStore((s) => s.aes.find((a) => a.id === clock.entityId));
  const batch = useStore((s) => s.batches.find((b) => b.id === ae?.batchId));
  const study = useStore((s) => s.studies.find((x) => x.id === clock.studyId));
  const reportSAE = useStore((s) => s.reportSAE);
  const canReport = useCan(clock.ruleId === 'SAE-EC-30D' ? 'ec:decide' : 'sae:report');
  const [sign, setSign] = useState(false);
  if (!ae) return null;
  const which = clock.ruleId === 'SAE-24H' ? '24h' : clock.ruleId === 'SAE-14D' ? '14d' : 'ec';
  const hot = clock.status === 'red' || clock.status === 'overdue';
  return (
    <div id={highlight ? 'tour-sae' : undefined} className={`card overflow-hidden ${hot ? 'border-red-300' : ''} ${highlight ? 'ring-2 ring-haldi-400' : ''}`}>
      <div className={`flex items-center justify-between gap-2 px-4 py-2 text-xs ${hot ? 'bg-red-50' : clock.status === 'amber' ? 'bg-amber-50' : 'bg-slate-50'}`}>
        <span className="font-semibold text-slate-700">{clock.ruleId} · {clock.ruleName}</span>
        <ClockPill status={clock.status} pulse />
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono rounded bg-slate-100 px-1.5 py-0.5">{ae.id}</span>
            <span className="font-medium text-slate-900">{ae.meddraPT ?? ae.verbatim}</span>
            {ae.namasteTerm && <span className="pill bg-haldi-50 text-haldi-600 ring-haldi-400/40">NAMASTE: {ae.namasteTerm}</span>}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {study?.code} · {ae.participantId} · {ae.seriousCriteria?.join(', ')} · causality {ae.causality}
          </div>
          {ae.narrative && <p className="mt-2 line-clamp-2 text-xs text-slate-600">{ae.narrative}</p>}
          <div className="mt-3"><ClockBar clock={clock} /></div>
          <div className="mt-1 flex justify-between text-[11px] text-slate-500"><span>Start {fmtDT(clock.startAt)}</span><span>Due {fmtDT(clock.dueAt)}</span></div>
          <div className="mt-2"><EscalationLadder clock={clock} /></div>
        </div>
        <div className="flex flex-col items-end justify-between gap-2 md:w-52">
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-[11px] uppercase tracking-wide text-slate-500"><Timer size={12} />{clock.stoppedAt ? 'Submitted' : clock.remainingMs < 0 ? 'Overdue by' : 'Time left'}</div>
            <div className={`font-mono text-2xl font-semibold tabular-nums ${clock.stoppedAt ? 'text-slate-500' : hot ? 'text-red-600' : clock.status === 'amber' ? 'text-amber-600' : 'text-emerald-700'}`}>
              {clock.stoppedAt ? fmtDT(clock.stoppedAt) : fmtDuration(Math.abs(clock.remainingMs))}
            </div>
          </div>
          {batch && (
            <Link href={`/batches/${batch.id}`} className="btn-ghost w-full text-xs"><Boxes size={13} /> Batch {batch.batchNo}</Link>
          )}
          {!clock.stoppedAt && (
            canReport
              ? <button className={`w-full text-xs ${hot ? 'btn-danger' : 'btn-primary'}`} onClick={() => setSign(true)}><Send size={13} /> {which === '24h' ? 'Submit initial report' : which === '14d' ? 'Submit analysis report' : 'Record EC opinion'}</button>
              : <span className="text-[11px] text-slate-400">Role cannot submit</span>
          )}
          {clock.stoppedAt && <span className="flex items-center gap-1 text-xs text-slate-500"><Check size={13} /> Clock stopped</span>}
        </div>
      </div>
      <ESignDialog open={sign} onClose={() => setSign(false)} entity="ae" entityId={ae.id} defaultMeaning="Responsible for content"
        title={`E-sign & submit: ${which === '24h' ? 'Initial SAE report (CLA / Sponsor / EC)' : which === '14d' ? 'SAE analysis report' : 'EC opinion'}`}
        onSigned={() => reportSAE(ae.id, which)} />
    </div>
  );
});

/** 21 CFR Part 11-style e-signature: re-authentication + meaning + timestamp, bound to an audit entry. */
export function ESignDialog({ open, onClose, entity, entityId, title, onSigned, defaultMeaning = 'Approved' }: {
  open: boolean; onClose: () => void; entity: string; entityId: string; title: string; onSigned?: (sig: ESignature) => void; defaultMeaning?: ESignature['meaning'];
}) {
  const sign = useStore((s) => s.sign);
  const me = useStore((s) => s.me());
  const canSign = useCan('esign');
  const [meaning, setMeaning] = useState<ESignature['meaning']>(defaultMeaning);
  const [pw, setPw] = useState('');
  const [otp, setOtp] = useState('');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const submit = () => {
    if (!canSign) { setErr('Your role is not authorised to sign.'); return; }
    if (pw !== 'demo' || !/^\d{6}$/.test(otp)) { setErr('Re-authentication failed (demo: password “demo”, any 6-digit code).'); return; }
    const sig = sign(entity, entityId, meaning, reason || undefined);
    onSigned?.(sig);
    setPw(''); setOtp(''); setReason(''); setErr('');
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={<span className="flex items-center gap-2"><PenLine size={16} /> {title}</span>}>
      <div className="space-y-3 text-sm">
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          Signing as <b>{me.name}</b> ({me.role}) on <span className="mono">{entity}/{entityId}</span>. The signature, its meaning and a server timestamp are bound to a new hash-chained audit entry (ALCOA+: attributable, contemporaneous, original).
        </div>
        <div>
          <label className="label">Meaning of signature</label>
          <select className="input" value={meaning} onChange={(e) => setMeaning(e.target.value as ESignature['meaning'])}>
            {(['Authored', 'Reviewed', 'Approved', 'Responsible for content'] as const).map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">Password</label><input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="demo" /></div>
          <div><label className="label">TOTP</label><input className="input font-mono" value={otp} maxLength={6} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="6 digits" /></div>
        </div>
        <div><label className="label">Reason / comment (optional)</label><input className="input" value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        {err && <div className="text-xs text-red-600">{err}</div>}
        <div className="flex justify-between">
          <button className="text-xs text-brand-700 underline" onClick={() => { setPw('demo'); setOtp('246810'); }}>Demo: autofill credentials</button>
          <div className="flex gap-2"><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit}><PenLine size={14} /> Sign</button></div>
        </div>
      </div>
    </Modal>
  );
}
