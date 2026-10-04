'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  FlaskConical,
  Activity,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { batchSignals } from '@/lib/analytics';
import { PageHeader, Card, Badge, AiOutput, Progress } from '@/components/ui';
import { EChart } from '@/components/EChart';

export default function BatchesPage() {
  const batches = useStore((s) => s.batches);
  const formulations = useStore((s) => s.formulations);
  const aes = useStore((s) => s.aes);
  const participants = useStore((s) => s.participants);

  const signals = useMemo(() => batchSignals(aes, batches), [aes, batches]);

  const activeSignals = signals.filter((s) => s.signal);

  // Chart: AE rate per 100 exposed per batch
  const chartOption = useMemo(() => {
    return {
      tooltip: { trigger: 'axis' as const },
      grid: { left: 90, right: 30, top: 20, bottom: 30 },
      xAxis: { type: 'value' as const, name: 'AEs / 100 Exposed' },
      yAxis: {
        type: 'category' as const,
        data: batches.map((b) => b.batchNo),
        axisLabel: { fontSize: 11 },
      },
      series: [
        {
          type: 'bar' as const,
          barMaxWidth: 20,
          data: signals.map((s) => ({
            value: s.ratePer100,
            itemStyle: {
              color: s.signal ? '#c2410c' : '#2a9781',
              borderRadius: [0, 4, 4, 0],
            },
          })),
        },
      ],
    };
  }, [batches, signals]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="ASU Pharmacovigilance"
        title="Formulation Batches & Signal Detection"
        subtitle="Batch-to-AE traceability for ASU medicines with disproportionality signal detection (PRR & χ² using Evans criteria)."
      />

      {/* Active Signal Banner */}
      {activeSignals.length > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-950 shadow-sm space-y-2">
          <div className="flex items-center gap-2 font-bold text-red-900 text-sm">
            <AlertTriangle className="text-red-600" size={18} />
            Statistical Disproportionality Signal Detected on {activeSignals.length} Batch(es)
          </div>
          <p className="text-xs text-red-800 leading-relaxed">
            Batch <b>{activeSignals.map((s) => batches.find((b) => b.id === s.batchId)?.batchNo).join(', ')}</b> exhibits
            a statistically significant cluster of hepatic/LFT adverse events fulfilling WHO-UMC Evans criteria.
            Review signal analytics below or drill into the batch for root-cause analysis and quarantine controls.
          </p>
        </div>
      )}

      {/* Overview Cards & Chart */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Batch AE Rate Comparison" className="lg:col-span-2">
          <EChart option={chartOption} height={260} />
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Orange indicates Evans threshold breach (PRR ≥ 2, χ² ≥ 4, n ≥ 3)</span>
            <span className="font-medium text-brand-800">5 ASU Batches Monitored</span>
          </div>
        </Card>

        {/* Signal Detection Summary */}
        <Card title="Pharmacovigilance Signals">
          <div className="space-y-3">
            {signals.map((sig) => {
              const b = batches.find((x) => x.id === sig.batchId)!;
              return (
                <div
                  key={sig.batchId}
                  className={`rounded-lg border p-3 text-xs transition ${
                    sig.signal
                      ? 'border-red-300 bg-red-50/60 ring-1 ring-red-200'
                      : 'border-slate-200 bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="mono text-slate-900">{b.batchNo}</span>
                    <Badge tone={sig.signal ? 'red' : 'green'}>
                      {sig.signal ? 'Signal Triggered' : 'Normal'}
                    </Badge>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-600 flex justify-between">
                    <span>Exposed: {sig.exposed}</span>
                    <span>AEs: {sig.aeCount} ({sig.saeCount} SAE)</span>
                    <span>PRR: <b>{sig.prr}</b></span>
                  </div>
                  <div className="mt-2 text-right">
                    <Link
                      href={`/batches/${sig.batchId}`}
                      className="text-[11px] font-medium text-brand-700 hover:underline"
                    >
                      Trace batch AEs →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Batches Table */}
      <Card title="All Released & Investigated Batches" bodyClass="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Batch Number</th>
              <th>Formulation</th>
              <th>Manufacturer</th>
              <th>Mfg / Exp Date</th>
              <th>QC Status</th>
              <th>Units Dispensed</th>
              <th>Linked AEs</th>
              <th>Signal Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => {
              const f = formulations.find((form) => form.id === batch.formulationId);
              const batchAes = aes.filter((a) => a.batchId === batch.id);
              const saeCount = batchAes.filter((a) => a.serious).length;
              const sig = signals.find((s) => s.batchId === batch.id);

              return (
                <tr key={batch.id}>
                  <td>
                    <Link
                      href={`/batches/${batch.id}`}
                      className="mono font-bold text-brand-800 hover:underline"
                    >
                      {batch.batchNo}
                    </Link>
                    <div className="text-[10px] text-slate-400 mono">{batch.id}</div>
                  </td>
                  <td>
                    <div className="font-medium text-slate-800 text-xs">{f?.name}</div>
                    <div className="text-[11px] text-slate-400">{f?.dosageForm}</div>
                  </td>
                  <td className="text-xs text-slate-600">{batch.manufacturer}</td>
                  <td className="text-xs text-slate-500 whitespace-nowrap">
                    <div>Mfg: {batch.mfgDate}</div>
                    <div>Exp: {batch.expiryDate}</div>
                  </td>
                  <td>
                    <Badge
                      tone={
                        batch.qcStatus === 'Released'
                          ? 'green'
                          : batch.qcStatus === 'Under investigation'
                          ? 'amber'
                          : 'red'
                      }
                    >
                      {batch.qcStatus}
                    </Badge>
                  </td>
                  <td className="tabular-nums font-semibold text-slate-700">
                    {batch.unitsDispensed}
                  </td>
                  <td>
                    <span className="tabular-nums font-semibold text-slate-900">
                      {batchAes.length}
                    </span>
                    {saeCount > 0 && (
                      <span className="ml-1 text-[11px] text-red-600 font-semibold">
                        ({saeCount} SAE)
                      </span>
                    )}
                  </td>
                  <td>
                    {sig?.signal ? (
                      <span className="pill bg-red-100 text-red-800 font-bold text-[10px]">
                        CLUSTER DETECTED
                      </span>
                    ) : (
                      <span className="pill bg-emerald-50 text-emerald-700 text-[10px]">
                        Safe Baseline
                      </span>
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/batches/${batch.id}`}
                      className="btn-ghost text-xs py-1 px-2"
                    >
                      Investigate →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
