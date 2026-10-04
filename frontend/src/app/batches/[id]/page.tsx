'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Boxes,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useCan, useT } from '@/lib/hooks';
import { batchSignals } from '@/lib/analytics';
import { PageHeader, Card, Badge, AiOutput, Modal, fmtDT, fmtDate } from '@/components/ui';
import { EChart } from '@/components/EChart';
import { ESignDialog } from '@/components/Clocks';
import type { Batch } from '@/lib/types';

export default function BatchDetailPage() {
  const params = useParams();
  const batchId = params.id as string;
  const t = useT();

  const batches = useStore((s) => s.batches);
  const formulations = useStore((s) => s.formulations);
  const aes = useStore((s) => s.aes);
  const participants = useStore((s) => s.participants);
  const setBatchStatus = useStore((s) => s.setBatchStatus);
  const canUpdate = useCan('batch:status');

  const [openStatusModal, setOpenStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<Batch['qcStatus']>('Quarantined');
  const [reason, setReason] = useState('');
  const [signModal, setSignModal] = useState(false);

  const batch = batches.find((b) => b.id === batchId);
  const formulation = formulations.find((f) => f.id === batch?.formulationId);
  const linkedAes = useMemo(() => aes.filter((a) => a.batchId === batchId), [aes, batchId]);

  const signals = useMemo(() => batchSignals(aes, batches), [aes, batches]);
  const signal = signals.find((s) => s.batchId === batchId);

  // Chart: SOC Distribution for this batch
  const socChart = useMemo(() => {
    if (!signal) return {};
    const entries = Object.entries(signal.socCounts).sort((a, b) => b[1] - a[1]);
    return {
      tooltip: { trigger: 'item' as const },
      series: [
        {
          type: 'pie' as const,
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: { show: true, fontSize: 11 },
          data: entries.map(([name, value]) => ({
            name,
            value,
            itemStyle: {
              color: name.includes('Hepatobiliary') || name.includes('Investigations')
                ? '#c2410c'
                : undefined,
            },
          })),
        },
      ],
    };
  }, [signal]);

  if (!batch) {
    return (
      <div className="card p-8 text-center">
        <h2 className="text-lg font-semibold">Batch not found</h2>
        <Link href="/batches" className="btn-primary mt-4">
          Back to Batches
        </Link>
      </div>
    );
  }

  const handleStatusSubmit = () => {
    setBatchStatus(batch.id, selectedStatus, reason || 'Safety signal review action');
    setOpenStatusModal(false);
    setReason('');
  };

  return (
    <div id="tour-batch" className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/batches"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-700"
        >
          <ArrowLeft size={14} /> Back to batches
        </Link>

        {canUpdate ? (
          <button
            onClick={() => setOpenStatusModal(true)}
            className="btn-danger text-xs"
          >
            <ShieldAlert size={14} /> Update Batch QC Status
          </button>
        ) : (
          <span className="text-xs text-slate-400">
            Batch status update restricted to PV Officers
          </span>
        )}
      </div>

      {/* Batch Header */}
      <div className="card p-6 border-l-4 border-l-haldi-500">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="mono font-bold text-xl text-slate-900">{batch.batchNo}</span>
              <span className="mono text-xs text-slate-400">ID: {batch.id}</span>
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
            </div>

            <div className="mt-2 text-sm text-slate-700">
              <b>Formulation:</b> {formulation?.name} ({formulation?.dosageForm})
            </div>
            <div className="text-xs text-slate-500">
              <b>Manufacturer:</b> {batch.manufacturer}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
            <div className="rounded bg-slate-50 p-2.5">
              <span className="text-slate-400 block">Units Dispensed</span>
              <span className="text-lg font-bold text-slate-900">{batch.unitsDispensed}</span>
            </div>
            <div className="rounded bg-slate-50 p-2.5">
              <span className="text-slate-400 block">Total AEs</span>
              <span className="text-lg font-bold text-slate-900">{linkedAes.length}</span>
            </div>
            <div className="rounded bg-slate-50 p-2.5">
              <span className="text-slate-400 block">Serious (SAEs)</span>
              <span className="text-lg font-bold text-red-600">
                {linkedAes.filter((a) => a.serious).length}
              </span>
            </div>
            <div className="rounded bg-slate-50 p-2.5">
              <span className="text-slate-400 block">PRR Metric</span>
              <span
                className={`text-lg font-bold ${
                  signal?.signal ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {signal?.prr ?? '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Certificate of Analysis Check */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-600" /> Heavy Metals Screening: Passed (AAS)
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-600" /> Microbial Limits: Passed (TPC & Pathogens)
          </span>
          <span className="text-slate-400">Mfg: {batch.mfgDate} · Exp: {batch.expiryDate}</span>
        </div>
      </div>

      {/* Signal Detection Explainable AI Box */}
      {signal && (
        <AiOutput
          k={`signal:${batch.id}`}
          title={
            <span>
              Statistical Cluster Detection (Evans Criteria):{' '}
              <b className={signal.signal ? 'text-red-700' : 'text-emerald-700'}>
                {signal.signal ? 'Signal Met' : 'No Signal Detected'}
              </b>
            </span>
          }
          why={signal.why}
          confidence={0.92}
        >
          <div className="mt-2 text-xs text-slate-600">
            <b>Mathematical Evidence:</b> Proportional Reporting Ratio (PRR) = <b>{signal.prr}</b> (Threshold ≥ 2.0) |
            Chi-Square (χ² with Yates correction) = <b>{signal.chi2}</b> (Threshold ≥ 4.0) |
            Observed Hepatic cases = <b>{signal.topSOCCount}</b> (Threshold ≥ 3).
          </div>
        </AiOutput>
      )}

      {/* Grid: SOC Breakdown and AE List */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Adverse Events by Organ Class (SOC)" className="lg:col-span-1">
          <EChart option={socChart} height={250} />
          <div className="mt-2 text-[11px] text-slate-500 text-center">
            {signal?.signal
              ? 'Highlighted orange: Hepatic/LFT cluster disproportionality'
              : 'Distribution across organ systems'}
          </div>
        </Card>

        <Card
          title={`All Linked Adverse Events for Batch ${batch.batchNo} (${linkedAes.length})`}
          className="lg:col-span-2"
          bodyClass="overflow-x-auto max-h-[380px]"
        >
          <table className="tbl">
            <thead>
              <tr>
                <th>AE ID</th>
                <th>Participant</th>
                <th>Reported Verbatim</th>
                <th>MedDRA PT</th>
                <th>Severity</th>
                <th>Serious</th>
                <th>Causality</th>
              </tr>
            </thead>
            <tbody>
              {linkedAes.map((ae) => (
                <tr key={ae.id} className={ae.serious ? 'bg-red-50/30' : ''}>
                  <td>
                    <span className="mono font-semibold text-slate-900">{ae.id}</span>
                  </td>
                  <td className="mono text-xs">{ae.participantId}</td>
                  <td>
                    <div className="font-medium text-slate-900">{ae.verbatim}</div>
                    {ae.namasteTerm && (
                      <div className="text-[11px] text-haldi-700">NAMASTE: {ae.namasteTerm}</div>
                    )}
                  </td>
                  <td className="text-xs font-semibold text-slate-800">
                    {ae.meddraPT ?? <span className="text-amber-600">Uncoded</span>}
                  </td>
                  <td>
                    <Badge tone={ae.severity === 'Severe' ? 'red' : 'slate'}>{ae.severity}</Badge>
                  </td>
                  <td>
                    {ae.serious ? (
                      <span className="pill bg-red-100 text-red-700 font-bold text-[10px]">
                        YES (SAE)
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">No</span>
                    )}
                  </td>
                  <td className="text-xs">{ae.causality}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Update Batch Status Modal */}
      <Modal
        open={openStatusModal}
        onClose={() => setOpenStatusModal(false)}
        title="Update Batch QC & Regulatory Status"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="label">Select New QC Status</label>
            <select
              className="input text-xs"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as Batch['qcStatus'])}
            >
              <option value="Released">Released (Normal distribution)</option>
              <option value="Under investigation">Under Investigation (Withhold further dispensing)</option>
              <option value="Quarantined">Quarantined (Immediate recall from all trial sites)</option>
            </select>
          </div>

          <div>
            <label className="label">Regulatory & Clinical Justification (Required for Audit Trail)</label>
            <textarea
              rows={3}
              className="input text-xs"
              placeholder="e.g. Quarantined due to PRR 4.2 breach on hepatic enzymes; sample forwarded to AIIA QC Lab for heavy metals & chemical adulteration testing."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setOpenStatusModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger"
              disabled={reason.length < 5}
              onClick={() => {
                setOpenStatusModal(false);
                setSignModal(true);
              }}
            >
              Proceed to E-Signature →
            </button>
          </div>
        </div>
      </Modal>

      {/* E-Signature Dialog */}
      <ESignDialog
        open={signModal}
        onClose={() => setSignModal(false)}
        entity="batch"
        entityId={batch.id}
        title={`E-Sign Batch Status Change to "${selectedStatus}"`}
        defaultMeaning="Approved"
        onSigned={() => {
          handleStatusSubmit();
        }}
      />
    </div>
  );
}
