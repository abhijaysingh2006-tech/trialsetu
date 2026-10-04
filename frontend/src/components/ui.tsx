'use client';

import { useEffect, type ReactNode } from 'react';
import { Eye, Lock, Sparkles, Check, X, Info } from 'lucide-react';
import { STATUS_STYLE, type ClockStatus } from '@/lib/rules';
import { useStore } from '@/lib/store';
import { useRoleDef } from '@/lib/hooks';

export function PageHeader({ title, subtitle, actions, kicker }: { title: string; subtitle?: string; actions?: ReactNode; kicker?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker && <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-haldi-600">{kicker}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">{title}</h1>
        {subtitle && <p className="mt-1 max-w-3xl text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = '', bodyClass = 'p-4', id }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClass?: string; id?: string }) {
  return (
    <section id={id} className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-h">
          <div className="card-t">{title}</div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export function Kpi({ label, value, sub, tone = 'brand', icon }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'brand' | 'red' | 'amber' | 'slate' | 'green'; icon?: ReactNode }) {
  const tones = {
    brand: 'from-brand-50 to-white text-brand-800', red: 'from-red-50 to-white text-red-700', amber: 'from-amber-50 to-white text-amber-800',
    slate: 'from-slate-50 to-white text-slate-800', green: 'from-emerald-50 to-white text-emerald-700',
  };
  return (
    <div className={`card bg-gradient-to-br p-4 ${tones[tone]}`}>
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span>{label}</span>
        <span className="opacity-70">{icon}</span>
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function ClockPill({ status, pulse }: { status: ClockStatus; pulse?: boolean }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`pill ${s.cls} ${pulse && (status === 'red' || status === 'overdue') ? 'pulse-red' : ''}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'brand' | 'red' | 'amber' | 'green' | 'violet' | 'sky' | 'haldi' }) {
  const t = {
    slate: 'bg-slate-50 text-slate-700 ring-slate-200', brand: 'bg-brand-50 text-brand-700 ring-brand-200', red: 'bg-red-50 text-red-700 ring-red-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200', green: 'bg-emerald-50 text-emerald-700 ring-emerald-200', violet: 'bg-violet-50 text-violet-700 ring-violet-200',
    sky: 'bg-sky-50 text-sky-700 ring-sky-200', haldi: 'bg-haldi-50 text-haldi-600 ring-haldi-400/40',
  };
  return <span className={`pill ${t[tone]}`}>{children}</span>;
}

export function StudyStatusBadge({ status }: { status: string }) {
  const tone = status === 'Recruiting' ? 'green' : status === 'Completed' ? 'slate' : status === 'Suspended' ? 'red' : status.startsWith('EC') ? 'violet' : 'sky';
  return <Badge tone={tone}>{status}</Badge>;
}

export function ReadOnlyBanner() {
  const r = useRoleDef();
  if (!r.readOnly) return null;
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-800">
      <Eye size={14} /> <b>Read-only regulator view.</b> All actions are disabled for this role; every page view is written to the audit chain.
    </div>
  );
}

export function Denied({ what }: { what: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-400" title={`Your role cannot ${what}`}>
      <Lock size={12} /> {what} — not permitted for role
    </span>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 pt-16 backdrop-blur-sm" onClick={onClose}>
      <div className={`card w-full ${wide ? 'max-w-4xl' : 'max-w-lg'}`} onClick={(e) => e.stopPropagation()}>
        <div className="card-h">
          <div className="card-t">{title}</div>
          <button className="text-slate-400 hover:text-slate-700" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/** Standard human-in-the-loop wrapper for any AI output: explain-why + accept/dismiss (audit-logged). */
export function AiOutput({ k, title, why, children, confidence, onAccept, disabled }: { k: string; title: ReactNode; why: string; children?: ReactNode; confidence?: number; onAccept?: () => void; disabled?: boolean }) {
  const decision = useStore((s) => s.aiDecisions[k]);
  const decide = useStore((s) => s.decideAI);
  return (
    <div className={`rounded-lg border p-3 ${decision?.decision === 'dismissed' ? 'border-slate-200 bg-slate-50 opacity-60' : decision?.decision === 'accepted' ? 'border-emerald-200 bg-emerald-50/50' : 'border-haldi-400/40 bg-haldi-50/40'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800"><Sparkles size={14} className="shrink-0 text-haldi-500" /> {title}</div>
          {children}
          <div className="mt-1.5 flex gap-1.5 text-xs text-slate-600"><Info size={12} className="mt-0.5 shrink-0 text-brand-600" /><span><b className="text-brand-700">Why:</b> {why}</span></div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {confidence !== undefined && <span className="mono rounded bg-white px-1.5 py-0.5 ring-1 ring-slate-200">{Math.round(confidence * 100)}%</span>}
          {decision ? (
            <span className={`text-xs font-medium ${decision.decision === 'accepted' ? 'text-emerald-700' : 'text-slate-500'}`}>{decision.decision === 'accepted' ? 'Accepted' : 'Dismissed'} · {decision.by.split(' ').slice(-1)[0]}</span>
          ) : (
            <div className="flex gap-1">
              <button disabled={disabled} className="btn bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700" onClick={() => { decide(k, 'accepted', `Accepted AI output: ${typeof title === 'string' ? title : k}`); onAccept?.(); }}><Check size={12} />Accept</button>
              <button disabled={disabled} className="btn-ghost px-2 py-1 text-xs" onClick={() => decide(k, 'dismissed', `Dismissed AI output: ${typeof title === 'string' ? title : k}`)}><X size={12} />Dismiss</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Progress({ value, max, tone = 'brand' }: { value: number; max: number; tone?: 'brand' | 'amber' | 'red' }) {
  const pct = Math.min(100, (value / Math.max(1, max)) * 100);
  const c = tone === 'red' ? 'bg-red-500' : tone === 'amber' ? 'bg-haldi-500' : 'bg-brand-500';
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${c}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export const fmtDate = (s?: string) => (s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
export const fmtDT = (s?: string | number) => (s ? new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
