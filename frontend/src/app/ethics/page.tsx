'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Stamp,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Building,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useCan, useClocks, useT } from '@/lib/hooks';
import { PageHeader, Card, Badge, ClockPill, Modal, fmtDate, fmtDT } from '@/components/ui';
import { ESignDialog } from '@/components/Clocks';
import type { Study } from '@/lib/types';

export default function EthicsPage() {
  const t = useT();
  const studies = useStore((s) => s.studies);
  const aes = useStore((s) => s.aes);
  const ecDecide = useStore((s) => s.ecDecide);
  const canDecide = useCan('ec:decide');

  const { clocks } = useClocks(1000);

  const [activeTab, setActiveTab] = useState<'renewals' | 'sae-opinions' | 'pending'>('renewals');
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'clarify'>('approve');
  const [signModal, setSignModal] = useState(false);

  // Filter clocks
  const renewalClocks = useMemo(
    () => clocks.filter((c) => c.ruleId === 'EC-RENEWAL').sort((a, b) => a.dueAt - b.dueAt),
    [clocks]
  );

  const saeOpinionClocks = useMemo(
    () => clocks.filter((c) => c.ruleId === 'SAE-EC-30D').sort((a, b) => a.dueAt - b.dueAt),
    [clocks]
  );

  const pendingInitial = useMemo(
    () => studies.filter((s) => s.ecRenewalStatus === 'Pending initial'),
    [studies]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Ethics Oversight & Governance"
        title={t('nav_ethics')}
        subtitle="Institutional Ethics Committee (IEC) approval tracking, annual continuing review renewal statutory clocks, and 30-day SAE opinions under NDCT Rules 2019."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="card p-4 bg-gradient-to-br from-violet-50 to-white">
          <span className="text-xs font-medium text-slate-500">Renewals Due ≤ 60d</span>
          <div className="mt-1 text-2xl font-bold text-violet-900">
            {renewalClocks.filter((c) => !c.stoppedAt && c.remainingMs < 60 * 86400000).length}
          </div>
          <span className="text-[11px] text-slate-400">Continuing review interval</span>
        </div>

        <div className="card p-4 bg-gradient-to-br from-red-50 to-white">
          <span className="text-xs font-medium text-slate-500">SAE Opinions Pending</span>
          <div className="mt-1 text-2xl font-bold text-red-600">
            {saeOpinionClocks.filter((c) => !c.stoppedAt).length}
          </div>
          <span className="text-[11px] text-slate-400">30-day statutory clock</span>
        </div>

        <div className="card p-4 bg-gradient-to-br from-amber-50 to-white">
          <span className="text-xs font-medium text-slate-500">Initial Approvals Pending</span>
          <div className="mt-1 text-2xl font-bold text-amber-700">{pendingInitial.length}</div>
          <span className="text-[11px] text-slate-400">Full board review required</span>
        </div>

        <div className="card p-4 bg-gradient-to-br from-emerald-50 to-white">
          <span className="text-xs font-medium text-slate-500">Active Approved Protocols</span>
          <div className="mt-1 text-2xl font-bold text-emerald-700">
            {studies.filter((s) => s.ecRenewalStatus === 'Approved').length}
          </div>
          <span className="text-[11px] text-slate-400">Valid IEC approvals</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 text-sm font-medium">
        <button
          onClick={() => setActiveTab('renewals')}
          className={`pb-2.5 px-3 transition border-b-2 ${
            activeTab === 'renewals'
              ? 'border-brand-600 text-brand-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Continuing Review Renewals ({renewalClocks.length})
        </button>
        <button
          onClick={() => setActiveTab('sae-opinions')}
          className={`pb-2.5 px-3 transition border-b-2 ${
            activeTab === 'sae-opinions'
              ? 'border-brand-600 text-brand-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          SAE Causality & Compensation Opinions ({saeOpinionClocks.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-2.5 px-3 transition border-b-2 ${
            activeTab === 'pending'
              ? 'border-brand-600 text-brand-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Initial Protocol Approvals ({pendingInitial.length})
        </button>
      </div>

      {/* Tab 1: Renewals */}
      {activeTab === 'renewals' && (
        <Card title="Continuing Review & Protocol Renewals (Due Date Tracking)">
          <table className="tbl">
            <thead>
              <tr>
                <th>Protocol Code & Title</th>
                <th>Ethics Committee</th>
                <th>Initial Approval</th>
                <th>Current Expiry Date</th>
                <th>Renewal Status</th>
                <th>Statutory Clock</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {renewalClocks.map((c) => {
                const s = studies.find((x) => x.id === c.studyId);
                if (!s) return null;
                const daysLeft = Math.round(c.remainingMs / 86400000);

                return (
                  <tr key={c.key}>
                    <td>
                      <Link
                        href={`/studies/${s.id}`}
                        className="font-semibold text-brand-800 hover:underline"
                      >
                        {s.code}
                      </Link>
                      <div className="text-xs text-slate-600 line-clamp-1">{s.title}</div>
                    </td>
                    <td className="text-xs text-slate-600">{s.ecName}</td>
                    <td className="text-xs text-slate-500">{fmtDate(s.ecApprovalDate)}</td>
                    <td className="text-xs font-semibold text-slate-800">
                      {fmtDate(s.ecExpiryDate)}
                    </td>
                    <td>
                      <Badge
                        tone={
                          s.ecRenewalStatus === 'Approved'
                            ? 'green'
                            : s.ecRenewalStatus === 'Renewal submitted'
                            ? 'amber'
                            : 'red'
                        }
                      >
                        {s.ecRenewalStatus}
                      </Badge>
                    </td>
                    <td>
                      <ClockPill status={c.status} />
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {c.stoppedAt ? 'Submitted' : `${daysLeft} days remaining`}
                      </div>
                    </td>
                    <td>
                      {canDecide ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setSelectedStudy(s);
                              setActionType('approve');
                              setSignModal(true);
                            }}
                            className="btn-primary text-xs py-1 px-2"
                          >
                            Approve (+1y)
                          </button>
                          <Link
                            href={`/interop?tab=packets&study=${s.id}`}
                            className="btn-ghost text-xs py-1 px-2"
                          >
                            Review Packet
                          </Link>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">EC Member only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Tab 2: SAE Opinions */}
      {activeTab === 'sae-opinions' && (
        <Card title="Ethics Committee Opinion on SAE (NDCT Rules 2019: 30 Days to Report to CLA)">
          <div className="space-y-4">
            {saeOpinionClocks.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No open SAE opinions pending EC review.
              </div>
            ) : (
              saeOpinionClocks.map((clock) => {
                const ae = aes.find((a) => a.id === clock.entityId);
                const s = studies.find((x) => x.id === clock.studyId);
                if (!ae) return null;

                return (
                  <div
                    key={clock.key}
                    className="card p-4 border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="mono font-bold text-slate-900">{ae.id}</span>
                        <span className="text-sm font-semibold text-slate-800">
                          {ae.meddraPT ?? ae.verbatim}
                        </span>
                        <ClockPill status={clock.status} />
                      </div>
                      <p className="text-xs text-slate-600">{ae.narrative}</p>
                      <div className="text-[11px] text-slate-400">
                        Protocol: {s?.code} · Causality: <b>{ae.causality}</b> · Participant: {ae.participantId}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {clock.stoppedAt ? (
                        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={14} /> Opinion Forwarded to CLA
                        </span>
                      ) : canDecide ? (
                        <button
                          onClick={() => {
                            ecDecide(clock.studyId, 'record-opinion', ae.id);
                          }}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          Record EC Opinion & Compensation Decision
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">EC Member Action Required</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* Tab 3: Initial Protocol Review */}
      {activeTab === 'pending' && (
        <Card title="Initial Protocols Submitted for Ethics Board Approval">
          <div className="space-y-3">
            {pendingInitial.map((s) => (
              <div
                key={s.id}
                className="card p-4 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="mono font-bold text-brand-900">{s.code}</span>
                    <span className="text-sm font-semibold text-slate-900">{s.title}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Condition: {s.ayurvedaCondition} ({s.condition}) · Sites: {s.sites.length} · Target: {s.target}
                  </div>
                </div>
                {canDecide ? (
                  <button
                    onClick={() => {
                      setSelectedStudy(s);
                      setActionType('approve');
                      setSignModal(true);
                    }}
                    className="btn-primary text-xs"
                  >
                    Grant Initial Approval (1 Year)
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">Read-only view</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* E-Signature Dialog for EC Decision */}
      {selectedStudy && (
        <ESignDialog
          open={signModal}
          onClose={() => setSignModal(false)}
          entity="ethics"
          entityId={selectedStudy.id}
          title={`E-Sign Ethics Approval for ${selectedStudy.code}`}
          defaultMeaning="Approved"
          onSigned={() => {
            ecDecide(selectedStudy.id, 'approve-renewal');
            setSelectedStudy(null);
          }}
        />
      )}
    </div>
  );
}
