'use client';

import { useState, useMemo } from 'react';
import {
  ScrollText,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  PenLine,
  Lock,
  FileCode,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { verifyChain } from '@/lib/audit';
import { useT } from '@/lib/hooks';
import { PageHeader, Card, Badge, fmtDT } from '@/components/ui';

export default function AuditPage() {
  const t = useT();
  const audit = useStore((s) => s.audit);
  const signatures = useStore((s) => s.signatures);
  const tamper = useStore((s) => s.tamper);
  const restoreTamper = useStore((s) => s.restoreTamper);
  const isTampered = Boolean(useStore((s) => s.tamperBackup));

  const [activeTab, setActiveTab] = useState<'log' | 'signatures'>('log');
  const [query, setQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  // Verify full hash chain
  const verification = useMemo(() => {
    return verifyChain(audit);
  }, [audit]);

  const filteredLog = useMemo(() => {
    return [...audit].reverse().filter((entry) => {
      const q = query.toLowerCase();
      const matchQ =
        !q ||
        entry.action.toLowerCase().includes(q) ||
        entry.actor.toLowerCase().includes(q) ||
        entry.entity.toLowerCase().includes(q) ||
        entry.entityId.toLowerCase().includes(q) ||
        entry.detail.toLowerCase().includes(q);
      const matchAction = filterAction === 'all' || entry.action === filterAction;
      return matchQ && matchAction;
    });
  }, [audit, query, filterAction]);

  return (
    <div id="tour-audit" className="space-y-6">
      <PageHeader
        kicker="Cryptographic Integrity & Regulatory Auditing"
        title={t('nav_audit')}
        subtitle="SHA-256 hash-chained, append-only ledger satisfying FDA 21 CFR Part 11 and CDSCO ALCOA+ principles (Attributable, Legible, Contemporaneous, Original, Accurate)."
      />

      {/* Verification Status Card */}
      <div
        className={`rounded-xl border p-5 shadow-card transition-all ${
          verification.ok
            ? 'border-emerald-300 bg-emerald-50/50'
            : 'border-red-400 bg-red-50 text-red-950'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                verification.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white animate-bounce'
              }`}
            >
              {verification.ok ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">
                  {verification.ok ? 'Ledger Integrity Intact' : 'CRITICAL: Cryptographic Hash Mismatch Detected!'}
                </h2>
                <Badge tone={verification.ok ? 'green' : 'red'}>
                  {verification.ok ? 'Valid Chain' : 'Chain Severed'}
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {verification.ok ? (
                  <>
                    Verified <b>{verification.checked}</b> sequentially linked block hashes in{' '}
                    <b>{verification.ms.toFixed(1)} ms</b>. Zero deletions, reorderings, or silent edits.
                  </>
                ) : (
                  <>
                    Tampering detected at <b>Entry #{verification.brokenAt}</b>: {verification.problem}.
                    The SHA-256 payload fingerprint no longer matches its stored hash.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Tamper / Restore Controls */}
          <div className="flex items-center gap-2">
            {!isTampered ? (
              <button
                onClick={() => tamper()}
                className="btn-ghost text-xs border-red-200 text-red-700 hover:bg-red-50"
                title="Inject an unauthorized modification into the audit memory to test cryptographic validation"
              >
                <AlertTriangle size={13} /> Simulate Tampering
              </button>
            ) : (
              <button
                onClick={() => restoreTamper()}
                className="btn-primary text-xs"
                title="Restore the authentic immutable block"
              >
                <RefreshCw size={13} /> Restore Authentic Ledger
              </button>
            )}
          </div>
        </div>

        {verification.ok && (
          <div className="mt-4 pt-3 border-t border-emerald-200/60 flex flex-wrap justify-between text-[11px] text-slate-500 mono">
            <span>Genesis Hash: 0000000000000000000000000000000000000000000000000000000000000000</span>
            <span>Current Head Hash: {verification.headHash.slice(0, 24)}...</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 text-sm font-medium">
        <button
          onClick={() => setActiveTab('log')}
          className={`pb-2.5 px-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'log'
              ? 'border-brand-600 text-brand-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ScrollText size={15} /> Append-Only Audit Log ({audit.length})
        </button>
        <button
          onClick={() => setActiveTab('signatures')}
          className={`pb-2.5 px-3 transition border-b-2 flex items-center gap-2 ${
            activeTab === 'signatures'
              ? 'border-brand-600 text-brand-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PenLine size={15} /> 21 CFR Part 11 Electronic Signatures ({signatures.length})
        </button>
      </div>

      {/* Tab 1: Audit Log Viewer */}
      {activeTab === 'log' && (
        <Card
          title={
            <div className="flex flex-wrap items-center justify-between gap-3 w-full">
              <span>Cryptographic Audit Entries (Newest First)</span>
              <div className="flex items-center gap-2 text-xs">
                <Search size={14} className="text-slate-400" />
                <input
                  className="input py-1 text-xs w-48"
                  placeholder="Search log..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select
                  className="input py-1 text-xs w-36"
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                >
                  <option value="all">All Actions</option>
                  <option value="CREATE">CREATE</option>
                  <option value="SAE_REPORT_24H">SAE_REPORT_24H</option>
                  <option value="CODE">CODE</option>
                  <option value="APPROVE">APPROVE</option>
                  <option value="ESIGN">ESIGN</option>
                  <option value="BREAK_GLASS">BREAK_GLASS</option>
                  <option value="BATCH_STATUS">BATCH_STATUS</option>
                  <option value="ACCESS">ACCESS</option>
                </select>
              </div>
            </div>
          }
          bodyClass="overflow-x-auto max-h-[580px]"
        >
          <table className="tbl">
            <thead>
              <tr>
                <th>Seq #</th>
                <th>Timestamp (UTC)</th>
                <th>Actor & Role</th>
                <th>Action</th>
                <th>Entity Target</th>
                <th>Description & Detail</th>
                <th>Justification</th>
                <th>SHA-256 Block Hash</th>
              </tr>
            </thead>
            <tbody>
              {filteredLog.map((entry) => {
                const isCorrupted = !verification.ok && entry.seq === verification.brokenAt;
                return (
                  <tr
                    key={entry.seq}
                    className={
                      isCorrupted
                        ? 'bg-red-100 text-red-950 font-semibold'
                        : entry.action.includes('SAE')
                        ? 'bg-amber-50/30'
                        : ''
                    }
                  >
                    <td className="mono font-bold">{entry.seq}</td>
                    <td className="text-xs text-slate-500 whitespace-nowrap">
                      {fmtDT(entry.ts)}
                    </td>
                    <td>
                      <div className="font-medium text-slate-800 text-xs">{entry.actor}</div>
                      <Badge tone={entry.role === 'leadership' ? 'brand' : 'slate'}>
                        {entry.role}
                      </Badge>
                    </td>
                    <td>
                      <span className="mono font-semibold text-xs text-brand-900 bg-brand-50 px-1.5 py-0.5 rounded">
                        {entry.action}
                      </span>
                    </td>
                    <td className="mono text-xs">
                      {entry.entity}/{entry.entityId}
                    </td>
                    <td className="text-xs text-slate-700 max-w-xs">{entry.detail}</td>
                    <td className="text-xs text-slate-500 italic max-w-xs">
                      {entry.reason || '—'}
                    </td>
                    <td className="mono text-[10px] text-slate-400">
                      <span title={`prev: ${entry.prevHash}`}>
                        {entry.hash.slice(0, 16)}...
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Tab 2: E-Signatures Ledger */}
      {activeTab === 'signatures' && (
        <Card title="ALCOA+ Electronic Signatures Ledger" bodyClass="overflow-x-auto">
          {signatures.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No electronic signatures recorded yet. Signatures are generated when submitting SAE reports, batch quarantines, or ethics approvals.
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Signature ID</th>
                  <th>Signer Name & Role</th>
                  <th>Legally Binding Meaning</th>
                  <th>Entity Signed</th>
                  <th>Timestamp</th>
                  <th>Audit Seq #</th>
                </tr>
              </thead>
              <tbody>
                {signatures.map((sig) => (
                  <tr key={sig.id}>
                    <td>
                      <span className="mono font-bold text-slate-900">{sig.id}</span>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-800 text-xs">{sig.signer}</div>
                      <Badge tone="violet">{sig.role}</Badge>
                    </td>
                    <td>
                      <Badge tone="brand">Meaning: {sig.meaning}</Badge>
                    </td>
                    <td className="mono text-xs">
                      {sig.entity}/{sig.entityId}
                    </td>
                    <td className="text-xs text-slate-500">{fmtDT(sig.ts)}</td>
                    <td className="mono font-semibold">#{sig.auditSeq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
