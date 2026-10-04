'use client';

import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Lock,
  Eye,
  KeyRound,
  FileCheck,
  Languages,
  UserCheck,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useCan, useT } from '@/lib/hooks';
import { PageHeader, Card, Badge, Modal, fmtDT, fmtDate } from '@/components/ui';
import type { Participant } from '@/lib/types';

export default function ConsentVaultPage() {
  const t = useT();
  const participants = useStore((s) => s.participants);
  const studies = useStore((s) => s.studies);
  const log = useStore((s) => s.log);
  const canBreakGlass = useCan('vault:breakglass');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterConsent, setFilterConsent] = useState('all');

  // Break-glass modal state
  const [breakGlassModal, setBreakGlassModal] = useState(false);
  const [selectedP, setSelectedP] = useState<Participant | null>(null);
  const [justification, setJustification] = useState('');
  const [unmaskedData, setUnmaskedData] = useState<{ name: string; phone: string; aadhaarLast4: string } | null>(null);

  const filtered = useMemo(() => {
    return participants.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchQ =
        !q ||
        p.id.toLowerCase().includes(q) ||
        p.vaultToken.toLowerCase().includes(q) ||
        p.studyId.toLowerCase().includes(q);
      const matchConsent = filterConsent === 'all' || p.consentStatus === filterConsent;
      return matchQ && matchConsent;
    });
  }, [participants, searchQuery, filterConsent]);

  const handleBreakGlass = () => {
    if (!selectedP || justification.length < 10) return;

    // Log the break-glass event in the hash-chained audit log
    log({
      action: 'BREAK_GLASS',
      entity: 'vault',
      entityId: selectedP.vaultToken,
      detail: `Emergency re-identification initiated for subject ${selectedP.id} (vault token ${selectedP.vaultToken})`,
      reason: justification,
    });

    // Provide synthetic unmasked record
    setUnmaskedData({
      name: `Synthetic Patient (${selectedP.id})`,
      phone: '+91-98765-XXXXX',
      aadhaarLast4: 'XXXX-XXXX-4291',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Data Protection & Privacy"
        title="Consent Ledger & Pseudonymised Vault"
        subtitle="Digital Personal Data Protection (DPDP) Act 2023 compliance architecture. Only pseudonymised tokens are displayed; direct identifiers are locked in the isolated India-region vault."
      />

      {/* DPDP Act 2023 Compliance Banner */}
      <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 text-xs text-brand-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-brand-800">
            <ShieldCheck size={16} /> DPDP Act 2023 Notice & Purpose-Specific Consent Architecture
          </div>
          <p className="text-slate-700 leading-relaxed">
            All participants consent in their preferred language (Hindi / English). Consents explicitly specify separate opt-in purposes:
            <b> Protocol Treatment</b>, <b> Pharmacovigilance Regulatory Sharing (NPvCC/PvPI)</b>, and <b> Secondary Research</b>.
            Patient identities are segregated in an isolated vault with strict break-glass cryptographic access auditing.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-lg bg-white border border-slate-200 p-2.5 text-center min-w-[100px]">
            <span className="text-[10px] text-slate-400 font-semibold block">Total Subjects</span>
            <span className="text-lg font-bold text-slate-800">{participants.length}</span>
          </div>
          <div className="rounded-lg bg-white border border-amber-200 p-2.5 text-center min-w-[100px]">
            <span className="text-[10px] text-amber-700 font-semibold block">Re-consent Due</span>
            <span className="text-lg font-bold text-amber-600">
              {participants.filter((p) => p.consentStatus === 'Re-consent required').length}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="flex flex-1 items-center gap-2 min-w-[240px]">
          <Search size={16} className="text-slate-400" />
          <input
            className="w-full text-sm outline-none placeholder:text-slate-400"
            placeholder="Search by pseudonym ID, vault token, or study..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Consent Status:</span>
          <select
            className="input py-1 text-xs"
            value={filterConsent}
            onChange={(e) => setFilterConsent(e.target.value)}
          >
            <option value="all">All ({participants.length})</option>
            <option value="Granted">Granted</option>
            <option value="Re-consent required">Re-consent required (ICF update)</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Participants Table */}
      <Card title="Pseudonymised Patient Vault & Consent Status" bodyClass="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <th>Pseudonym ID</th>
              <th>Vault Token</th>
              <th>Study & Site</th>
              <th>Demographics</th>
              <th>ICF Version</th>
              <th>Language</th>
              <th>Consent Status</th>
              <th>Purpose Grants</th>
              <th>Emergency Unmask</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="mono font-bold text-slate-900">{p.id}</span>
                </td>
                <td className="mono text-slate-400 text-xs">{p.vaultToken}</td>
                <td>
                  <div className="font-semibold text-xs text-brand-900">{p.studyId}</div>
                  <div className="text-[10px] text-slate-400">Site {p.siteId}</div>
                </td>
                <td className="text-xs text-slate-600">
                  {p.sex === 'F' ? 'Female' : 'Male'}, {p.age}y
                </td>
                <td className="mono text-xs">{p.consentVersion}</td>
                <td>
                  <Badge tone={p.consentLanguage === 'Hindi' ? 'haldi' : 'sky'}>
                    {p.consentLanguage}
                  </Badge>
                </td>
                <td>
                  <Badge
                    tone={
                      p.consentStatus === 'Granted'
                        ? 'green'
                        : p.consentStatus === 'Re-consent required'
                        ? 'amber'
                        : 'red'
                    }
                  >
                    {p.consentStatus}
                  </Badge>
                </td>
                <td>
                  <div className="flex gap-1 text-[10px]">
                    <span
                      title="Trial Treatment"
                      className={`pill ${p.consentPurposes.trial ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                    >
                      Trial
                    </span>
                    <span
                      title="Pharmacovigilance Sharing"
                      className={`pill ${p.consentPurposes.pvSharing ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                    >
                      PV
                    </span>
                    <span
                      title="Future Research"
                      className={`pill ${p.consentPurposes.futureResearch ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                    >
                      Research
                    </span>
                  </div>
                </td>
                <td>
                  <button
                    disabled={!canBreakGlass}
                    onClick={() => {
                      setSelectedP(p);
                      setJustification('');
                      setUnmaskedData(null);
                      setBreakGlassModal(true);
                    }}
                    className="btn-ghost text-xs py-1 px-2 text-slate-600 hover:text-red-700 hover:border-red-200"
                    title="Emergency Break-Glass Re-identification"
                  >
                    <KeyRound size={12} /> Break-Glass
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Break Glass Modal */}
      <Modal
        open={breakGlassModal}
        onClose={() => setBreakGlassModal(false)}
        title="Emergency Vault Break-Glass (Subject Re-identification)"
      >
        <div className="space-y-4 text-xs">
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle size={15} className="text-red-600" /> Statutory Warning (DPDP Act 2023)
            </div>
            <p className="text-[11px] leading-relaxed">
              Unmasking patient identity is restricted to life-threatening clinical emergencies, medical interventions, or court-ordered regulatory inquiries.
              Every break-glass request is <b>permanently recorded in the SHA-256 append-only audit log</b> with the investigator credentials and timestamp.
            </p>
          </div>

          <div>
            <span className="text-slate-500 block">Target Subject:</span>
            <span className="mono font-bold text-sm text-slate-900">
              {selectedP?.id} (Vault Token: {selectedP?.vaultToken})
            </span>
          </div>

          {!unmaskedData ? (
            <>
              <div>
                <label className="label">
                  Clinical & Legal Justification (Mandatory, minimum 10 characters)
                </label>
                <textarea
                  rows={3}
                  className="input text-xs"
                  placeholder="e.g. Admitted in casualty with anaphylaxis; unmasking identity to review hospital records and notify legal next-of-kin."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setBreakGlassModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={justification.trim().length < 10}
                  onClick={handleBreakGlass}
                  className="btn-danger"
                >
                  Confirm Break-Glass & Unmask
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50/50 p-4 space-y-2">
              <div className="font-bold text-emerald-900 text-sm">
                Identity Successfully Unmasked (Audited)
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                <div>
                  <span className="text-slate-400 block">Full Name:</span>
                  <span className="font-semibold text-slate-900">{unmaskedData.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Emergency Contact:</span>
                  <span className="font-semibold text-slate-900">{unmaskedData.phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">National Health Identifier / Aadhaar:</span>
                  <span className="mono font-semibold text-slate-900">
                    {unmaskedData.aadhaarLast4}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 pt-2 border-t border-emerald-100">
                Logged to sequence #{useStore.getState().audit.length} in the tamper-proof ledger.
              </div>
              <div className="flex justify-end pt-2">
                <button
                  className="btn-primary text-xs"
                  onClick={() => setBreakGlassModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
