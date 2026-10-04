'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import {
  Languages,
  Search,
  Check,
  X,
  Edit2,
  Sparkles,
  Info,
  ShieldCheck,
  Database,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useCan, useT } from '@/lib/hooks';
import { mockAdapter, ADAPTERS, type CodingResult } from '@/lib/coding';
import { PageHeader, Card, Badge, Modal, AiOutput } from '@/components/ui';
import type { AdverseEvent } from '@/lib/types';

export default function CodingPage() {
  const searchParams = useSearchParams();
  const aeParam = searchParams.get('ae');
  const t = useT();

  const aes = useStore((s) => s.aes);
  const codeAE = useStore((s) => s.codeAE);
  const rejectCoding = useStore((s) => s.rejectCoding);
  const canCode = useCan('coding:decide');

  const [selectedAeId, setSelectedAeId] = useState<string>(aeParam ?? aes[0]?.id ?? '');
  const [customInput, setCustomInput] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [customPt, setCustomPt] = useState('');
  const [customSoc, setCustomSoc] = useState('Gastrointestinal disorders');

  useEffect(() => {
    if (aeParam) setSelectedAeId(aeParam);
  }, [aeParam]);

  const selectedAe = useMemo(() => aes.find((a) => a.id === selectedAeId), [aes, selectedAeId]);

  // Query terminology bridge
  const queryTerm = customInput.trim() || selectedAe?.namasteTerm || selectedAe?.verbatim || '';
  const codingResult: CodingResult = useMemo(() => {
    if (!queryTerm) return { suggestions: [] };
    return mockAdapter.suggest(queryTerm);
  }, [queryTerm]);

  const uncodedCount = aes.filter((a) => a.codingStatus !== 'Coded').length;

  return (
    <div id="tour-coding" className="space-y-6">
      <PageHeader
        kicker="Ayurveda Terminology Interoperability"
        title="Terminology Bridge (NAMASTE / TM2 → MedDRA)"
        subtitle="Bridge classical Ayurveda diagnostic terms & dosha concepts to standard biomedical MedDRA Preferred Terms (PT) with human-in-the-loop validation."
      />

      {/* Licensing & Regulatory Notice */}
      <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 text-xs text-brand-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-brand-800">
            <ShieldCheck size={15} /> Pluggable Coding Adapter Architecture
          </div>
          <p className="text-slate-700 leading-relaxed">
            Shipped with <b>Mock NAMASTE/TM2 Adapter</b> (~20 curated Ayurveda concepts & dosha patterns).
            In production at AIIA, official <b>MedDRA® (MSSO)</b> and <b>WHODrug (UMC)</b> licensed ASCII releases
            are loaded into the platform under institutional licence.
          </p>
        </div>
        <div className="flex gap-2">
          {ADAPTERS.map((ad) => (
            <div
              key={ad.id}
              className={`rounded-lg p-2.5 text-center border text-[11px] min-w-[120px] ${
                ad.available
                  ? 'border-brand-300 bg-white text-brand-900 font-semibold'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}
            >
              <div>{ad.id === 'mock-namaste-meddra' ? 'Demo Mock Table' : ad.label.split(' ')[0]}</div>
              <div className="text-[10px] font-normal">{ad.available ? 'Active (Demo)' : 'Licensed (AIIA)'}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: AE Coding Worklist */}
        <Card
          title={
            <span className="flex items-center justify-between w-full">
              <span>Adverse Events Coding Queue</span>
              <span className="pill bg-amber-50 text-amber-800 text-[10px] font-bold">
                {uncodedCount} Pending
              </span>
            </span>
          }
          className="lg:col-span-1"
          bodyClass="p-2 space-y-1 max-h-[560px] overflow-y-auto"
        >
          {aes.map((ae) => {
            const isSelected = ae.id === selectedAeId;
            return (
              <button
                key={ae.id}
                onClick={() => {
                  setSelectedAeId(ae.id);
                  setCustomInput('');
                }}
                className={`w-full rounded-lg p-2.5 text-left text-xs transition border ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="mono font-semibold text-slate-800">{ae.id}</span>
                  <Badge
                    tone={
                      ae.codingStatus === 'Coded'
                        ? 'green'
                        : ae.codingStatus === 'Suggested'
                        ? 'amber'
                        : 'slate'
                    }
                  >
                    {ae.codingStatus}
                  </Badge>
                </div>
                <div className="mt-1 font-medium text-slate-900 line-clamp-1">{ae.verbatim}</div>
                {ae.namasteTerm && (
                  <div className="text-[11px] text-haldi-700 font-medium">
                    NAMASTE: {ae.namasteTerm}
                  </div>
                )}
                <div className="mt-1 text-[10px] text-slate-400 flex justify-between">
                  <span>{ae.studyId}</span>
                  <span>{ae.serious ? 'SAE' : 'Non-serious'}</span>
                </div>
              </button>
            );
          })}
        </Card>

        {/* Right 2 Columns: Coding Workspace */}
        <div className="lg:col-span-2 space-y-5">
          {selectedAe ? (
            <Card title={`Active Coding Workspace: ${selectedAe.id}`}>
              {/* Event Details Box */}
              <div className="rounded-lg bg-slate-50 p-3.5 space-y-2 text-xs border border-slate-200">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold block">
                      Reported Verbatim (Site Entry)
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{selectedAe.verbatim}</span>
                  </div>
                  <Badge tone={selectedAe.serious ? 'red' : 'slate'}>
                    {selectedAe.serious ? 'Serious (SAE)' : 'Non-serious'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-slate-400 block">Investigator Ayurveda Term (NAMASTE)</span>
                    <span className="font-semibold text-haldi-800 text-sm">
                      {selectedAe.namasteTerm || 'None reported'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Current MedDRA PT</span>
                    <span className="font-semibold text-brand-900 text-sm">
                      {selectedAe.meddraPT ? (
                        `${selectedAe.meddraPT} (${selectedAe.meddraSOC})`
                      ) : (
                        <span className="text-amber-600 font-normal">Pending coding decision</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Freeform Search Bar */}
              <div className="mt-4">
                <label className="label">
                  Interactive Concept Query (Search NAMASTE term, Dosha, or Devanagari)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      className="input pl-8 text-xs"
                      placeholder="Type an Ayurveda term (e.g. Kamala, Atisara, Pitta Vriddhi, Amlapitta, शीतपित्त)..."
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                    />
                  </div>
                  {customInput && (
                    <button
                      onClick={() => setCustomInput('')}
                      className="btn-ghost text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Concept Match Card (if matched in NAMASTE/TM2) */}
              {codingResult.concept && (
                <div className="mt-4 rounded-lg border border-haldi-300 bg-haldi-50/40 p-3.5 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-haldi-900 text-sm flex items-center gap-1.5">
                      <BookOpen size={15} /> NAMASTE Concept Match
                    </span>
                    <span className="mono rounded bg-white px-2 py-0.5 text-slate-700 ring-1 ring-haldi-200">
                      {codingResult.concept.namasteCode}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <div>
                      <span className="text-slate-500">Classical Term:</span>{' '}
                      <b>{codingResult.concept.term}</b> ({codingResult.concept.devanagari})
                    </div>
                    <div>
                      <span className="text-slate-500">ICD-11 TM2 Code:</span>{' '}
                      <b>{codingResult.concept.tm2Code}</b> ({codingResult.concept.tm2Title})
                    </div>
                    <div>
                      <span className="text-slate-500">Construct:</span>{' '}
                      <Badge tone="violet">{codingResult.concept.kind}</Badge>
                    </div>
                  </div>
                  <p className="text-slate-700 italic">{codingResult.concept.gloss}</p>
                </div>
              )}

              {/* Suggestions List */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-haldi-500" /> MedDRA Candidate Preferred Terms (Human-in-the-Loop)
                  </span>
                  <button
                    onClick={() => {
                      setCustomPt(selectedAe.meddraPT ?? '');
                      setEditModalOpen(true);
                    }}
                    className="text-xs text-brand-700 hover:underline flex items-center gap-1"
                  >
                    <Edit2 size={12} /> Enter Custom Coding
                  </button>
                </div>

                {codingResult.suggestions.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 p-6 text-center text-xs text-slate-400">
                    No automated suggestions for this query. Use the custom coding action above.
                  </div>
                ) : (
                  codingResult.suggestions.map((sug, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-slate-200 bg-white p-3.5 transition hover:border-brand-300 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{sug.pt}</span>
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                              {sug.soc}
                            </span>
                            <span className="mono rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-800">
                              {Math.round(sug.confidence * 100)}% match
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                            <b className="text-slate-700">Rationale:</b> {sug.why}
                          </p>
                        </div>

                        {/* Decision Buttons */}
                        <div className="flex shrink-0 gap-1.5">
                          <button
                            disabled={!canCode}
                            onClick={() => {
                              codeAE(selectedAe.id, sug.pt, sug.soc, 'accepted', sug.confidence);
                            }}
                            className="btn-primary text-xs py-1 px-2.5"
                          >
                            <Check size={12} /> Accept
                          </button>
                          <button
                            disabled={!canCode}
                            onClick={() => {
                              rejectCoding(selectedAe.id, sug.pt);
                            }}
                            className="btn-ghost text-xs py-1 px-2 text-slate-400 hover:text-red-600"
                            title="Reject suggestion"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          ) : (
            <div className="card p-8 text-center text-slate-400 text-xs">
              Select an adverse event from the queue to start coding.
            </div>
          )}
        </div>
      </div>

      {/* Manual Coding Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Manual MedDRA Coding Entry (Human Override)"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="label">MedDRA Preferred Term (PT)</label>
            <input
              className="input text-xs"
              placeholder="e.g. Drug-induced liver injury / Urticaria"
              value={customPt}
              onChange={(e) => setCustomPt(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">System Organ Class (SOC)</label>
            <select
              className="input text-xs"
              value={customSoc}
              onChange={(e) => setCustomSoc(e.target.value)}
            >
              {[
                'Gastrointestinal disorders',
                'Hepatobiliary disorders',
                'Skin and subcutaneous tissue disorders',
                'Nervous system disorders',
                'Investigations',
                'General disorders and administration site conditions',
                'Metabolism and nutrition disorders',
                'Psychiatric disorders',
                'Musculoskeletal and connective tissue disorders',
                'Renal and urinary disorders',
                'Immune system disorders',
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!customPt.trim()}
              onClick={() => {
                if (selectedAe) {
                  codeAE(selectedAe.id, customPt.trim(), customSoc, 'edited');
                  setEditModalOpen(false);
                }
              }}
            >
              Confirm & Save to Audit Log
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
