'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building,
  Calendar,
  FileText,
  ShieldCheck,
  Siren,
  Sparkles,
  Users,
  Download,
  AlertTriangle,
  Boxes,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useClocks, useT } from '@/lib/hooks';
import { forecastEnrolment } from '@/lib/analytics';
import {
  PageHeader,
  Card,
  StudyStatusBadge,
  ClockPill,
  Progress,
  Badge,
  AiOutput,
  fmtDate,
  fmtDT,
} from '@/components/ui';
import { EChart } from '@/components/EChart';
import { SaeClockCard } from '@/components/Clocks';

export default function StudyDetailPage() {
  const params = useParams();
  const studyId = params.id as string;
  const t = useT();
  const lang = useStore((s) => s.lang);
  const studies = useStore((s) => s.studies);
  const sites = useStore((s) => s.sites);
  const formulations = useStore((s) => s.formulations);
  const batches = useStore((s) => s.batches);
  const participants = useStore((s) => s.participants);
  const aes = useStore((s) => s.aes);
  const deviations = useStore((s) => s.deviations);
  const { clocks, now } = useClocks(1000);

  const study = studies.find((s) => s.id === studyId);
  const formulation = formulations.find((f) => f.id === study?.formulationId);
  const studyBatches = batches.filter((b) => b.formulationId === study?.formulationId);

  const studyParticipants = useMemo(
    () => participants.filter((p) => p.studyId === studyId),
    [participants, studyId]
  );
  const studyAes = useMemo(() => aes.filter((a) => a.studyId === studyId), [aes, studyId]);
  const studyDeviations = useMemo(
    () => deviations.filter((d) => d.studyId === studyId),
    [deviations, studyId]
  );

  const studyClocks = useMemo(
    () => clocks.filter((c) => c.studyId === studyId),
    [clocks, studyId]
  );

  const forecast = useMemo(
    () => (study ? forecastEnrolment(study, now) : null),
    [study, now]
  );

  const chartOption = useMemo(() => {
    if (!forecast) return {};
    const months = forecast.series.map((s) => s.month);
    const actuals = forecast.series.map((s) => s.actual ?? null);
    const projecteds = forecast.series.map((s) => s.projected ?? null);

    return {
      tooltip: { trigger: 'axis' as const },
      legend: { data: ['Actual Enrolment', 'AI Projection', 'Target'] },
      grid: { left: 45, right: 20, top: 35, bottom: 25 },
      xAxis: { type: 'category' as const, data: months },
      yAxis: { type: 'value' as const, max: Math.max(study?.target ?? 100, forecast.target) },
      series: [
        {
          name: 'Actual Enrolment',
          type: 'line' as const,
          data: actuals,
          smooth: true,
          itemStyle: { color: '#1d7a69' },
          lineStyle: { width: 3 },
        },
        {
          name: 'AI Projection',
          type: 'line' as const,
          data: projecteds,
          smooth: true,
          lineStyle: { type: 'dashed' as const, color: '#e69a14', width: 2 },
          itemStyle: { color: '#e69a14' },
        },
        {
          name: 'Target',
          type: 'line' as const,
          data: months.map(() => study?.target ?? 0),
          symbol: 'none',
          lineStyle: { type: 'dotted' as const, color: '#94a3b8' },
        },
      ],
    };
  }, [forecast, study]);

  if (!study) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-800">Study not found</h2>
        <Link href="/studies" className="btn-primary mt-4">
          Back to Study Registry
        </Link>
      </div>
    );
  }

  const enrolled = studyParticipants.length;
  const percent = Math.round((enrolled / study.target) * 100);

  return (
    <div id="tour-study" className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/studies"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-700"
        >
          <ArrowLeft size={14} /> Back to registry
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/interop?tab=packets&study=${study.id}`}
            className="btn-ghost text-xs"
          >
            <Download size={13} /> Export CTRI Packet
          </Link>
        </div>
      </div>

      {/* Main Study Header */}
      <div className="card p-6 border-l-4 border-l-brand-600">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono rounded bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-900">
                {study.code}
              </span>
              <span className="mono text-xs text-slate-500 font-medium">CTRI: {study.ctriNo}</span>
              <StudyStatusBadge status={study.status} />
              <Badge tone="violet">{study.phase}</Badge>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">
              {lang === 'hi' ? study.titleHi : study.title}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              <b>Ayurveda Target:</b> {study.ayurvedaCondition} · <b>Biomedical Correlate:</b> {study.condition}
            </p>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">{study.design}</p>
          </div>

          <div className="flex flex-col items-end gap-1.5 text-right">
            <div className="text-xs text-slate-500">Overall Enrolment</div>
            <div className="text-3xl font-bold tabular-nums text-brand-900">
              {enrolled} <span className="text-sm font-normal text-slate-400">/ {study.target}</span>
            </div>
            <div className="w-36">
              <Progress value={enrolled} max={study.target} />
            </div>
            <span className="text-xs font-semibold text-brand-700">{percent}% achieved</span>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 md:grid-cols-4 text-xs">
          <div>
            <span className="text-slate-400 block">Lead Principal Investigator</span>
            <span className="font-semibold text-slate-800">{study.piName}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Ethics Committee</span>
            <span className="font-semibold text-slate-800">{study.ecName}</span>
          </div>
          <div>
            <span className="text-slate-400 block">EC Approval Expiry</span>
            <span className="font-semibold text-slate-800">
              {fmtDate(study.ecExpiryDate)} ({study.ecRenewalStatus})
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">CTRI Last Updated</span>
            <span className="font-semibold text-slate-800">{fmtDate(study.ctriLastUpdated)}</span>
          </div>
        </div>
      </div>

      {/* Statutory Clocks for this Study */}
      {studyClocks.length > 0 && (
        <Card
          title={
            <span className="flex items-center gap-2">
              <Clock size={16} className="text-brand-600" /> Statutory Clocks & Clocks in Progress
            </span>
          }
          bodyClass="space-y-3 p-4"
        >
          <div className="grid gap-3 md:grid-cols-2">
            {studyClocks.map((c) => (
              <SaeClockCard key={c.key} clock={c} />
            ))}
          </div>
        </Card>
      )}

      {/* Grid: Enrolment Forecast & Formulation Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: AI Enrolment Forecast */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title={
              <span className="flex items-center gap-2">
                <Sparkles size={16} className="text-haldi-500" /> Enrolment Pace & Forecast
              </span>
            }
          >
            <EChart option={chartOption} height={280} />

            {forecast && (
              <div className="mt-4">
                <AiOutput
                  k={`forecast:${study.id}`}
                  title={
                    <span>
                      Enrolment Risk Assessment: <b>{forecast.risk}</b>
                    </span>
                  }
                  why={forecast.why}
                  confidence={0.88}
                >
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded bg-slate-50 p-2">
                      <div className="font-semibold text-slate-800">{forecast.ratePerMonth}/mo</div>
                      <div className="text-slate-400">Current Run-rate</div>
                    </div>
                    <div className="rounded bg-slate-50 p-2">
                      <div className="font-semibold text-slate-800">{forecast.requiredRate}/mo</div>
                      <div className="text-slate-400">Required Run-rate</div>
                    </div>
                    <div className="rounded bg-slate-50 p-2">
                      <div className="font-semibold text-slate-800">
                        {forecast.projectedDate ? fmtDate(forecast.projectedDate) : 'N/A'}
                      </div>
                      <div className="text-slate-400">Projected Completion</div>
                    </div>
                  </div>
                </AiOutput>
              </div>
            )}
          </Card>

          {/* Multi-Centre Sites Breakdown */}
          <Card title="Participating Trial Sites (AIIA Network)">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Site Name & Location</th>
                  <th>Site PI</th>
                  <th>Target</th>
                  <th>Enrolled</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {study.sites.map((ss) => {
                  const siteMeta = sites.find((s) => s.id === ss.siteId);
                  const siteEnrolled = studyParticipants.filter((p) => p.siteId === ss.siteId).length;
                  return (
                    <tr key={ss.siteId}>
                      <td>
                        <div className="font-medium text-slate-900">{siteMeta?.name ?? ss.siteId}</div>
                        <div className="text-xs text-slate-500">
                          {siteMeta?.city}, {siteMeta?.state}
                        </div>
                      </td>
                      <td className="text-xs">{ss.piName}</td>
                      <td className="tabular-nums font-medium">{ss.target}</td>
                      <td>
                        <span className="tabular-nums font-semibold text-brand-800">
                          {siteEnrolled}
                        </span>
                        <div className="w-20 mt-1">
                          <Progress value={siteEnrolled} max={ss.target} />
                        </div>
                      </td>
                      <td>
                        <Badge tone="green">Active</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Right Col: ASU Formulation & Batches */}
        <div className="space-y-4">
          <Card title="ASU Formulation & Pharmacopoeia">
            {formulation ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Classical Formulation</span>
                  <span className="text-sm font-semibold text-brand-900">{formulation.name}</span>
                  <span className="text-slate-500 block font-devanagari">{formulation.nameHi}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Dosage Form & Regimen</span>
                  <span className="text-slate-800 font-medium">{formulation.dosageForm}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Composition</span>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                    {formulation.ingredients}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Textual Reference</span>
                  <span className="italic text-slate-700">{formulation.reference}</span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-400">No formulation linked</span>
            )}
          </Card>

          <Card title="Formulation Batches Dispensed">
            <div className="space-y-2">
              {studyBatches.map((b) => (
                <Link
                  key={b.id}
                  href={`/batches/${b.id}`}
                  className="block rounded-lg border border-slate-200 p-2.5 transition hover:border-brand-300 hover:bg-brand-50/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="mono font-semibold text-brand-900">{b.batchNo}</span>
                    <Badge tone={b.qcStatus === 'Released' ? 'green' : 'red'}>{b.qcStatus}</Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
                    <span>Mfg: {b.mfgDate}</span>
                    <span>Exp: {b.expiryDate}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-brand-700">
                    Trace batch-to-AE signal →
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card title="Safety & Compliance Snapshot">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Adverse Events (AE):</span>
                <span className="font-semibold">{studyAes.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Serious Adverse Events (SAE):</span>
                <span className="font-semibold text-red-600">
                  {studyAes.filter((a) => a.serious).length}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Protocol Deviations:</span>
                <span className="font-semibold">{studyDeviations.length}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
