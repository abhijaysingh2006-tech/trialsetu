'use client';

import { useMemo, useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  TrendingDown,
  Activity,
  Check,
  X,
  Filter,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useCan, useT } from '@/lib/hooks';
import { forecastEnrolment, detectAnomalies, batchSignals } from '@/lib/analytics';
import { PageHeader, Card, Badge, AiOutput, Progress, fmtDate } from '@/components/ui';

export default function AiInsightsPage() {
  const t = useT();
  const studies = useStore((s) => s.studies);
  const visits = useStore((s) => s.visits);
  const participants = useStore((s) => s.participants);
  const batches = useStore((s) => s.batches);
  const aes = useStore((s) => s.aes);
  const aiDecisions = useStore((s) => s.aiDecisions);
  const canDecide = useCan('ai:decide');

  const [activeTab, setActiveTab] = useState<'anomalies' | 'forecasts' | 'signals'>('anomalies');

  // Enrolment forecasts
  const forecasts = useMemo(() => {
    const now = Date.now();
    return studies.map((s) => forecastEnrolment(s, now));
  }, [studies]);

  // Data anomalies
  const anomalies = useMemo(() => {
    return detectAnomalies(visits, participants, batches);
  }, [visits, participants, batches]);

  // Batch signals
  const signals = useMemo(() => {
    return batchSignals(aes, batches);
  }, [aes, batches]);

  const atRiskForecasts = forecasts.filter((f) => f.risk === 'Off track' || f.risk === 'At risk');

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Explainable Clinical Intelligence"
        title="Human-in-the-Loop AI Insights"
        subtitle="Transparent algorithmic surveillance across enrolment timelines, clinical lab anomalies, and formulation batch disproportionality. Every AI output provides an explicit 'Why' rationale."
      />

      {/* Governance Banner */}
      <div className="rounded-xl border border-haldi-300 bg-haldi-50/50 p-4 text-xs text-haldi-900 shadow-sm flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="font-bold flex items-center gap-1.5 text-haldi-800">
            <ShieldCheck size={16} /> Strict Human-in-the-Loop Protocol (GCP Compliance)
          </div>
          <p className="text-slate-700">
            No machine learning model automatically executes protocol changes or writes final safety conclusions.
            Investigator and PV officer decisions (Accept / Dismiss) are permanently captured with e-signatures in the hash-chained audit log.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 text-sm font-medium">
        <button
          onClick={() => setActiveTab('anomalies')}
          className={`pb-2.5 px-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'anomalies'
              ? 'border-brand-600 text-brand-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity size={15} /> Clinical & Lab Anomalies ({anomalies.length})
        </button>
        <button
          onClick={() => setActiveTab('forecasts')}
          className={`pb-2.5 px-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'forecasts'
              ? 'border-brand-600 text-brand-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingDown size={15} /> Enrolment Pace Risks ({atRiskForecasts.length})
        </button>
        <button
          onClick={() => setActiveTab('signals')}
          className={`pb-2.5 px-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'signals'
              ? 'border-brand-600 text-brand-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle size={15} /> Batch Disproportionality Signals ({signals.filter((s) => s.signal).length})
        </button>
      </div>

      {/* Tab 1: Clinical & Lab Anomalies */}
      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Screening for out-of-range LFTs (ALT &gt; 3x ULN hepatotoxicity), unit conversion errors (lbs vs kg), visit window protocol deviations, and site-level digit preference rounding.
          </div>

          <div className="grid gap-3">
            {anomalies.map((anom) => (
              <AiOutput
                key={anom.key}
                k={anom.key}
                title={
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{anom.title}</span>
                    <Badge tone={anom.severity === 'High' ? 'red' : anom.severity === 'Medium' ? 'amber' : 'slate'}>
                      {anom.severity} Severity
                    </Badge>
                    <span className="mono text-[11px] text-slate-400">
                      {anom.subject} ({anom.studyId})
                    </span>
                  </div>
                }
                why={anom.why}
                confidence={anom.severity === 'High' ? 0.95 : 0.85}
                disabled={!canDecide}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Enrolment Forecasts */}
      {activeTab === 'forecasts' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Linear least-squares regression projected across the last 6 months of site enrolment history compared against regulatory planned last-patient-in target date.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {forecasts.map((f) => {
              const study = studies.find((s) => s.id === f.studyId);
              if (!study) return null;
              return (
                <div key={f.studyId} className="card p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="mono font-semibold text-brand-800 text-xs">
                        {study.code}
                      </span>
                      <h3 className="font-semibold text-sm text-slate-900 line-clamp-1">
                        {study.title}
                      </h3>
                    </div>
                    <Badge
                      tone={
                        f.risk === 'On track'
                          ? 'green'
                          : f.risk === 'At risk'
                          ? 'amber'
                          : f.risk === 'Off track'
                          ? 'red'
                          : 'slate'
                      }
                    >
                      {f.risk}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Accrual Target</span>
                      <span className="font-semibold tabular-nums">
                        {f.current} / {f.target}
                      </span>
                    </div>
                    <Progress value={f.current} max={f.target} />
                  </div>

                  <AiOutput
                    k={`forecast_ai:${f.studyId}`}
                    title={
                      <span>
                        Run-rate: <b>{f.ratePerMonth} / month</b> (Req: {f.requiredRate}/mo)
                      </span>
                    }
                    why={f.why}
                    confidence={0.88}
                    disabled={!canDecide}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Batch Signals */}
      {activeTab === 'signals' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Proportional Reporting Ratio (PRR) and Chi-square disproportionality metrics computed for all formulation batches against the portfolio background.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {signals.map((sig) => {
              const b = batches.find((x) => x.id === sig.batchId);
              return (
                <div
                  key={sig.batchId}
                  className={`card p-4 space-y-3 ${
                    sig.signal ? 'border-red-300 ring-1 ring-red-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="mono font-bold text-sm text-slate-900">
                        {b?.batchNo}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">
                        ({sig.exposed} patients exposed)
                      </span>
                    </div>
                    <Badge tone={sig.signal ? 'red' : 'green'}>
                      {sig.signal ? 'Cluster Detected' : 'Baseline'}
                    </Badge>
                  </div>

                  <AiOutput
                    k={`batch_ai:${sig.batchId}`}
                    title={
                      <span>
                        PRR: <b>{sig.prr}</b> | χ²: <b>{sig.chi2}</b>
                      </span>
                    }
                    why={sig.why}
                    confidence={0.91}
                    disabled={!canDecide}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
