'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Siren,
  Plus,
  Filter,
  Search,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Boxes,
  FileCheck,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useCan, useClocks, useT } from '@/lib/hooks';
import { PageHeader, Card, ClockPill, Badge, Modal, fmtDT, fmtDate } from '@/components/ui';
import { SaeClockCard } from '@/components/Clocks';
import type { AdverseEvent, Causality, SeriousCriterion, Severity } from '@/lib/types';

export default function SafetyPage() {
  const searchParams = useSearchParams();
  const focusId = searchParams.get('focus');
  const t = useT();

  const aes = useStore((s) => s.aes);
  const studies = useStore((s) => s.studies);
  const batches = useStore((s) => s.batches);
  const participants = useStore((s) => s.participants);
  const addAE = useStore((s) => s.addAE);
  const canAdd = useCan('ae:create');

  const { clocks } = useClocks(5000);

  const [tab, setTab] = useState<'clocks' | 'all-aes' | 'saes'>('clocks');
  const [filterQuery, setFilterQuery] = useState('');
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (focusId) {
      setTab('clocks');
    }
  }, [focusId]);

  // Separate SAE clocks from others
  const saeClocks = useMemo(
    () => clocks.filter((c) => c.appliesTo === 'SAE').sort((a, b) => a.remainingMs - b.remainingMs),
    [clocks]
  );

  const hotClocks = useMemo(
    () => saeClocks.filter((c) => c.status === 'red' || c.status === 'overdue'),
    [saeClocks]
  );

  const filteredAes = useMemo(() => {
    return aes.filter((a) => {
      if (tab === 'saes' && !a.serious) return false;
      const q = filterQuery.toLowerCase();
      if (!q) return true;
      return (
        a.id.toLowerCase().includes(q) ||
        a.verbatim.toLowerCase().includes(q) ||
        (a.meddraPT && a.meddraPT.toLowerCase().includes(q)) ||
        (a.namasteTerm && a.namasteTerm.toLowerCase().includes(q)) ||
        a.studyId.toLowerCase().includes(q) ||
        a.participantId.toLowerCase().includes(q)
      );
    });
  }, [aes, tab, filterQuery]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Pharmacovigilance & Statutory Compliance"
        title="Safety & Statutory Clocks"
        subtitle="NDCT Rules 2019 statutory deadline tracking for SAE reporting, 14-day analysis, and EC opinions with multi-tier escalation."
        actions={
          <button
            onClick={() => setOpenModal(true)}
            disabled={!canAdd}
            className="btn-primary"
          >
            <Plus size={15} /> Log Adverse Event (AE / SAE)
          </button>
        }
      />

      {/* Statutory Rules Notice Banner */}
      <div className="rounded-xl border border-haldi-400/40 bg-haldi-50/50 p-4 text-xs text-haldi-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-haldi-800">
            <ShieldAlert size={14} /> NDCT Rules 2019 · Third Schedule Statutory Requirements:
          </div>
          <p className="text-slate-700">
            1. <b>24-Hour Clock:</b> Investigator must report SAE within 24 hours of awareness to CLA, Sponsor, and EC.
            <br />
            2. <b>14-Day Clock:</b> Complete medical analysis report to CLA and EC Chairperson within 14 calendar days.
            <br />
            3. <b>Escalation Ladder:</b> Automatically alerts Site Investigator → PV Officer → Lead PI → Leadership/Regulator desk.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-lg bg-white border border-red-200 px-3 py-2 text-center">
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Critical Clocks</span>
            <span className="text-lg font-bold text-red-600">{hotClocks.length}</span>
          </div>
          <div className="rounded-lg bg-white border border-slate-200 px-3 py-2 text-center">
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Total Open SAEs</span>
            <span className="text-lg font-bold text-slate-800">
              {aes.filter((a) => a.serious && a.status !== 'Closed').length}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-sm font-medium">
        <button
          onClick={() => setTab('clocks')}
          className={`pb-2.5 px-3 transition border-b-2 ${
            tab === 'clocks'
              ? 'border-brand-600 text-brand-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Statutory Clocks ({saeClocks.length})
        </button>
        <button
          onClick={() => setTab('saes')}
          className={`pb-2.5 px-3 transition border-b-2 ${
            tab === 'saes'
              ? 'border-brand-600 text-brand-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Serious Adverse Events (SAEs) ({aes.filter((a) => a.serious).length})
        </button>
        <button
          onClick={() => setTab('all-aes')}
          className={`pb-2.5 px-3 transition border-b-2 ${
            tab === 'all-aes'
              ? 'border-brand-600 text-brand-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          All Adverse Events ({aes.length})
        </button>
      </div>

      {/* View: Active Clocks */}
      {tab === 'clocks' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {saeClocks.map((clock, idx) => {
              const isFocused = focusId ? focusId === clock.entityId : idx === 0;
              return (
                <SaeClockCard
                  key={clock.key}
                  clock={clock}
                  highlight={isFocused}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* View: AE/SAE List Table */}
      {(tab === 'all-aes' || tab === 'saes') && (
        <Card
          title={tab === 'saes' ? 'Serious Adverse Events Log' : 'All Adverse Events (Coded & Uncoded)'}
          actions={
            <div className="flex items-center gap-2">
              <Search size={14} className="text-slate-400" />
              <input
                className="input py-1 text-xs w-48"
                placeholder="Filter events..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
            </div>
          }
          bodyClass="overflow-x-auto"
        >
          <table className="tbl">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Participant & Study</th>
                <th>Verbatim / Ayurveda Term</th>
                <th>MedDRA PT & SOC</th>
                <th>Batch Lot</th>
                <th>Severity</th>
                <th>Aware Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAes.map((ae) => {
                const batch = batches.find((b) => b.id === ae.batchId);
                return (
                  <tr key={ae.id} className={ae.serious ? 'bg-red-50/20' : ''}>
                    <td>
                      <span className="mono font-semibold text-slate-900">{ae.id}</span>
                      {ae.serious && (
                        <span className="ml-1.5 pill bg-red-100 text-red-800 text-[10px]">
                          SAE
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="mono text-xs">{ae.participantId}</div>
                      <div className="text-[11px] text-slate-400">{ae.studyId}</div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-900">{ae.verbatim}</div>
                      {ae.namasteTerm && (
                        <div className="text-[11px] text-haldi-700 font-medium">
                          NAMASTE: {ae.namasteTerm}
                        </div>
                      )}
                    </td>
                    <td>
                      {ae.meddraPT ? (
                        <div>
                          <div className="font-semibold text-slate-800 text-xs">{ae.meddraPT}</div>
                          <div className="text-[11px] text-slate-400">{ae.meddraSOC}</div>
                        </div>
                      ) : (
                        <span className="pill bg-amber-50 text-amber-700">Uncoded</span>
                      )}
                    </td>
                    <td className="mono text-xs">
                      {batch ? (
                        <span className="text-brand-800 font-semibold">{batch.batchNo}</span>
                      ) : (
                        <span className="text-slate-400">Control / None</span>
                      )}
                    </td>
                    <td>
                      <Badge
                        tone={
                          ae.severity === 'Severe'
                            ? 'red'
                            : ae.severity === 'Moderate'
                            ? 'amber'
                            : 'slate'
                        }
                      >
                        {ae.severity}
                      </Badge>
                    </td>
                    <td className="text-xs text-slate-500 whitespace-nowrap">
                      {fmtDT(ae.awareAt)}
                    </td>
                    <td>
                      <Badge tone={ae.status === 'Closed' ? 'green' : 'amber'}>{ae.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* AE/SAE Entry Modal */}
      <CreateAEModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        participants={participants}
        studies={studies}
        batches={batches}
        onSave={(data) => {
          addAE(data);
          setOpenModal(false);
        }}
      />
    </div>
  );
}

function CreateAEModal({
  open,
  onClose,
  participants,
  studies,
  batches,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  participants: ReturnType<typeof useStore.getState>['participants'];
  studies: ReturnType<typeof useStore.getState>['studies'];
  batches: ReturnType<typeof useStore.getState>['batches'];
  onSave: (ae: Omit<AdverseEvent, 'id'>) => void;
}) {
  const [pid, setPid] = useState(participants[0]?.id ?? '');
  const [verbatim, setVerbatim] = useState('');
  const [namasteTerm, setNamasteTerm] = useState('');
  const [severity, setSeverity] = useState<Severity>('Moderate');
  const [serious, setSerious] = useState(false);
  const [criterion, setCriterion] = useState<SeriousCriterion>('Hospitalisation');
  const [causality, setCausality] = useState<Causality>('Possible');
  const [narrative, setNarrative] = useState('');

  const selectedP = participants.find((p) => p.id === pid);
  const selectedBatch = batches.find((b) => b.id === selectedP?.batchId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedP || !verbatim) return;

    const now = new Date().toISOString();
    onSave({
      participantId: selectedP.id,
      studyId: selectedP.studyId,
      siteId: selectedP.siteId,
      batchId: selectedP.batchId,
      verbatim,
      namasteTerm: namasteTerm.trim() || undefined,
      severity,
      serious,
      seriousCriteria: serious ? [criterion] : undefined,
      causality,
      outcome: 'Recovering',
      onsetAt: now,
      awareAt: now,
      status: 'Open',
      narrative: narrative.trim() || undefined,
      codingStatus: 'Uncoded',
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Log Adverse Event (CDASH AE / SAE)" wide>
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Participant ID</label>
            <select
              className="input text-xs"
              value={pid}
              onChange={(e) => setPid(e.target.value)}
            >
              {participants.slice(0, 50).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id} ({p.studyId} · {p.arm})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Linked Formulation Batch</label>
            <input
              className="input bg-slate-50 text-xs font-mono"
              readOnly
              value={selectedBatch ? `${selectedBatch.batchNo} (${selectedBatch.id})` : 'No Batch / Control'}
            />
            <span className="text-[10px] text-slate-400">
              Traceability: automatically linked from participant allocation.
            </span>
          </div>
        </div>

        <div>
          <label className="label">Adverse Event Verbatim (What happened?)</label>
          <input
            className="input text-xs"
            placeholder="e.g. Jaundice with dark urine and nausea after 3 weeks of dosing"
            value={verbatim}
            onChange={(e) => setVerbatim(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">NAMASTE / Ayurveda Diagnosis Term (Optional)</label>
            <input
              className="input text-xs"
              placeholder="e.g. Kamala (Pittaja) / Shirashoola / Amlapitta"
              value={namasteTerm}
              onChange={(e) => setNamasteTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Severity / Intensity</label>
            <select
              className="input text-xs"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
            >
              <option value="Mild">Mild (Well tolerated)</option>
              <option value="Moderate">Moderate (Interferes with activity)</option>
              <option value="Severe">Severe (Incapacitating)</option>
            </select>
          </div>
        </div>

        {/* Seriousness Checkbox */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
          <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              className="rounded text-brand-600 focus:ring-brand-500"
              checked={serious}
              onChange={(e) => setSerious(e.target.checked)}
            />
            <span>Is this a SERIOUS Adverse Event (SAE)?</span>
          </label>

          {serious && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="label">Seriousness Criterion</label>
                <select
                  className="input text-xs"
                  value={criterion}
                  onChange={(e) => setCriterion(e.target.value as SeriousCriterion)}
                >
                  <option value="Hospitalisation">Hospitalisation / Prolongation</option>
                  <option value="Life-threatening">Life-threatening</option>
                  <option value="Death">Death</option>
                  <option value="Disability">Persistent/Significant Disability</option>
                  <option value="Congenital anomaly">Congenital Anomaly</option>
                  <option value="Other medically important">Other Medically Important Event</option>
                </select>
              </div>

              <div>
                <label className="label">Investigator Causality Assessment (WHO-UMC)</label>
                <select
                  className="input text-xs"
                  value={causality}
                  onChange={(e) => setCausality(e.target.value as Causality)}
                >
                  <option value="Certain">Certain</option>
                  <option value="Probable">Probable / Likely</option>
                  <option value="Possible">Possible</option>
                  <option value="Unlikely">Unlikely</option>
                  <option value="Unassessable">Unassessable / Unclassifiable</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="label">Clinical Narrative / Context</label>
          <textarea
            rows={3}
            className="input text-xs"
            placeholder="Clinical course, labs, dechallenge / rechallenge actions..."
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Submit & Start Clock (Audited)
          </button>
        </div>
      </form>
    </Modal>
  );
}
