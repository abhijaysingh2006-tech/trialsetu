'use client';

import Link from 'next/link';
import {
  Gauge,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ExternalLink,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useCompliance } from '@/lib/compliance';
import { useT } from '@/lib/hooks';
import { PageHeader, Card, Badge, Progress } from '@/components/ui';

export default function ScorecardPage() {
  const t = useT();
  const { criteria, overall } = useCompliance();

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Smart India Hackathon 2026 · PS SIH26046"
        title="Live Compliance Scorecard"
        subtitle="Real-time compliance scorecard continuously verified against the four hackathon evaluation metrics, backed by verifiable cryptographic and conformance evidence."
      />

      {/* Hero Score Badge */}
      <div className="card p-6 bg-gradient-to-r from-brand-900 to-brand-800 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-brand-200 text-xs font-semibold uppercase tracking-wider">
            <Award size={16} className="text-haldi-400" /> Ministry of Ayush & AIIA Platform Benchmark
          </div>
          <h2 className="text-2xl font-bold">Overall Platform Conformance Score</h2>
          <p className="text-xs text-brand-200 max-w-xl leading-relaxed">
            All four metrics are computed dynamically in real-time from the active trial dataset,
            hash-chained audit logs, and structural conformance checkers — zero hard-coded scores.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 shrink-0">
          <div className="text-center">
            <div className="text-4xl font-extrabold tabular-nums text-white">
              {overall}<span className="text-lg font-normal text-brand-200">/100</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-300">
              {overall >= 90 ? 'Regulatory Grade' : 'Remediation Active'}
            </span>
          </div>
        </div>
      </div>

      {/* 4 PS Evaluation Criteria Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {criteria.map((c) => (
          <div
            key={c.id}
            className={`card p-5 space-y-4 flex flex-col justify-between border-t-4 ${
              c.pass ? 'border-t-emerald-600' : 'border-t-red-600'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Evaluation Target: {c.target}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{c.title}</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  {c.pass ? (
                    <span className="pill bg-emerald-50 text-emerald-800 font-bold text-xs ring-emerald-200">
                      <CheckCircle2 size={13} className="text-emerald-600" /> PASS
                    </span>
                  ) : (
                    <span className="pill bg-red-50 text-red-800 font-bold text-xs ring-red-200">
                      <XCircle size={13} className="text-red-600" /> ACTION REQUIRED
                    </span>
                  )}
                  <span className="text-lg font-extrabold tabular-nums ml-1 text-slate-800">
                    {c.score}%
                  </span>
                </div>
              </div>

              <div className="mt-2 text-xs font-semibold text-brand-800 bg-brand-50/50 p-2 rounded border border-brand-100/50">
                Live Status: {c.headline}
              </div>

              {/* Evidence Items */}
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                <span className="text-xs font-semibold text-slate-700 block">
                  Verifiable Ground-Truth Evidence:
                </span>
                {c.evidence.map((ev, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-none"
                  >
                    <span className="text-slate-600">{ev.label}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${ev.ok ? 'text-slate-800' : 'text-red-600'}`}>
                        {ev.value}
                      </span>
                      {ev.href && (
                        <Link
                          href={ev.href}
                          className="text-brand-700 hover:text-brand-900 text-[11px] hover:underline"
                        >
                          Verify →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Progress value={c.score} max={100} tone={c.pass ? 'brand' : 'red'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
