'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import {
  Share2,
  FileCode,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Building,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useClocks, useT } from '@/lib/hooks';
import {
  researchStudy,
  patient,
  researchSubject,
  medication,
  adverseEvent,
  bundle,
  validate,
  type FhirResource,
} from '@/lib/fhir';
import {
  buildSDTM,
  buildADaM,
  checkConformance,
  toCSV,
  defineXML,
  download,
  ctriPacket,
  ecPacket,
  packetHTML,
} from '@/lib/exports';
import { PageHeader, Card, Badge, Modal } from '@/components/ui';

export default function InteropPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'fhir' | 'sdtm' | 'packets') ?? 'fhir';
  const studyParam = searchParams.get('study');

  const t = useT();
  const studies = useStore((s) => s.studies);
  const participants = useStore((s) => s.participants);
  const batches = useStore((s) => s.batches);
  const formulations = useStore((s) => s.formulations);
  const aes = useStore((s) => s.aes);
  const deviations = useStore((s) => s.deviations);
  const sites = useStore((s) => s.sites);
  const me = useStore((s) => s.me());
  const role = useStore((s) => s.role);
  const markCtriUpdated = useStore((s) => s.markCtriUpdated);

  const { clocks } = useClocks(5000);

  const [tab, setTab] = useState<'fhir' | 'sdtm' | 'packets'>(initialTab);
  const [selectedStudyId, setSelectedStudyId] = useState(studyParam ?? studies[0]?.id ?? 'T10');
  const [selectedResource, setSelectedResource] = useState<FhirResource | null>(null);

  useEffect(() => {
    const t = searchParams.get('tab') as 'fhir' | 'sdtm' | 'packets';
    if (t && (t === 'fhir' || t === 'sdtm' || t === 'packets')) {
      setTab(t);
    }
    const s = searchParams.get('study');
    if (s) {
      setSelectedStudyId(s);
    }
  }, [searchParams]);

  // FHIR Resources Collection
  const fhirResources = useMemo(() => {
    const s = studies.find((x) => x.id === selectedStudyId);
    const f = formulations.find((x) => x.id === s?.formulationId);
    const pList = participants.filter((p) => p.studyId === selectedStudyId).slice(0, 15);
    const bList = batches.filter((b) => b.formulationId === s?.formulationId);
    const aeList = aes.filter((a) => a.studyId === selectedStudyId).slice(0, 10);

    const list: FhirResource[] = [];
    if (s) list.push(researchStudy(s, f));
    pList.forEach((p) => {
      list.push(patient(p));
      list.push(researchSubject(p));
    });
    bList.forEach((b) => list.push(medication(b, f)));
    aeList.forEach((a) => list.push(adverseEvent(a)));

    return list;
  }, [studies, formulations, participants, batches, aes, selectedStudyId]);

  const knownRefs = useMemo(
    () => new Set(fhirResources.map((r) => `${r.resourceType}/${r.id}`)),
    [fhirResources]
  );

  // CDISC SDTM & ADaM Datasets
  const sdtmDatasets = useMemo(
    () => buildSDTM(studies, participants, aes, useStore.getState().visits, selectedStudyId),
    [studies, participants, aes, selectedStudyId]
  );
  const adamDatasets = useMemo(
    () => buildADaM(sdtmDatasets, participants),
    [sdtmDatasets, participants]
  );
  const allDatasets = useMemo(() => [...sdtmDatasets, ...adamDatasets], [sdtmDatasets, adamDatasets]);
  const conformanceIssues = useMemo(() => checkConformance(allDatasets), [allDatasets]);

  // Regulatory Packets
  const selectedStudy = studies.find((s) => s.id === selectedStudyId) ?? studies[0];
  const selectedFormulation = formulations.find((f) => f.id === selectedStudy.formulationId);
  const selectedBatches = batches.filter((b) => b.formulationId === selectedStudy.formulationId);

  const packetContext = useMemo(() => {
    return {
      study: selectedStudy,
      sites,
      participants: participants.filter((p) => p.studyId === selectedStudy.id),
      aes: aes.filter((a) => a.studyId === selectedStudy.id),
      deviations: deviations.filter((d) => d.studyId === selectedStudy.id),
      clocks: clocks.filter((c) => c.studyId === selectedStudy.id),
      formulation: selectedFormulation,
      batches: selectedBatches,
      preparedBy: me.name,
      role,
    };
  }, [selectedStudy, sites, participants, aes, deviations, clocks, selectedFormulation, selectedBatches, me, role]);

  const ctriPack = useMemo(() => ctriPacket(packetContext), [packetContext]);
  const ecPack = useMemo(() => ecPacket(packetContext), [packetContext]);

  return (
    <div id="tour-packet" className="space-y-6">
      <PageHeader
        kicker="Healthcare Standards & Open Data Interoperability"
        title="FHIR R4 & Regulatory Export Engine"
        subtitle="HAPI FHIR R4 interoperability layer, CDISC SDTM/ADaM clinical study data packages with Define-XML 2.1, and hashed CTRI / Ethics Committee dossiers."
      />

      {/* Target Study Selector */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700">Target Study Protocol:</span>
          <select
            className="input py-1 text-xs w-72 font-medium"
            value={selectedStudyId}
            onChange={(e) => setSelectedStudyId(e.target.value)}
          >
            {studies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.title.slice(0, 45)}...
              </option>
            ))}
          </select>
        </div>

        <div className="flex rounded-lg border border-slate-200 p-0.5 text-xs bg-slate-50 font-medium">
          <button
            onClick={() => setTab('fhir')}
            className={`rounded-md px-3 py-1 transition ${
              tab === 'fhir' ? 'bg-white shadow-sm text-brand-800 font-semibold' : 'text-slate-600'
            }`}
          >
            HL7 FHIR R4
          </button>
          <button
            onClick={() => setTab('sdtm')}
            className={`rounded-md px-3 py-1 transition ${
              tab === 'sdtm' ? 'bg-white shadow-sm text-brand-800 font-semibold' : 'text-slate-600'
            }`}
          >
            CDISC SDTM / ADaM
          </button>
          <button
            onClick={() => setTab('packets')}
            className={`rounded-md px-3 py-1 transition ${
              tab === 'packets' ? 'bg-white shadow-sm text-brand-800 font-semibold' : 'text-slate-600'
            }`}
          >
            CTRI & EC Packets
          </button>
        </div>
      </div>

      {/* Tab 1: FHIR R4 Resources */}
      {tab === 'fhir' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card
            title={`FHIR R4 Resources (${fhirResources.length})`}
            className="lg:col-span-1"
            actions={
              <button
                onClick={() => {
                  const b = bundle(fhirResources);
                  download(`fhir-bundle-${selectedStudyId}.json`, JSON.stringify(b, null, 2), 'application/json');
                }}
                className="btn-primary text-xs py-1 px-2.5"
              >
                <Download size={13} /> Export Bundle
              </button>
            }
            bodyClass="p-2 space-y-1 max-h-[560px] overflow-y-auto"
          >
            {fhirResources.map((res) => {
              const checks = validate(res, knownRefs);
              const hasErrors = checks.some((c) => !c.pass && c.level === 'error');
              const isSelected = selectedResource?.id === res.id && selectedResource?.resourceType === res.resourceType;

              return (
                <button
                  key={`${res.resourceType}-${res.id}`}
                  onClick={() => setSelectedResource(res)}
                  className={`w-full rounded-lg p-2.5 text-left text-xs transition border ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/50'
                      : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{res.resourceType}</span>
                    <Badge tone={hasErrors ? 'red' : 'green'}>
                      {hasErrors ? 'Validation Issue' : 'Valid R4'}
                    </Badge>
                  </div>
                  <div className="mt-1 mono text-slate-500 text-[11px] truncate">
                    id: {res.id}
                  </div>
                </button>
              );
            })}
          </Card>

          {/* Resource Viewer & Conformance Checks */}
          <div className="lg:col-span-2 space-y-4">
            {selectedResource ? (
              <Card title={`${selectedResource.resourceType}/${selectedResource.id}`}>
                <div className="space-y-3">
                  {/* Validation Checks */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs">
                    <span className="font-semibold text-slate-800 block">
                      FHIR R4 Conformance & AIIA Ayurvedic IG Constraints:
                    </span>
                    {validate(selectedResource, knownRefs).map((check) => (
                      <div key={check.id} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          {check.pass ? (
                            <CheckCircle2 size={13} className="text-emerald-600" />
                          ) : (
                            <AlertTriangle size={13} className="text-red-500" />
                          )}
                          {check.label}
                        </span>
                        <span className="mono text-[10px] text-slate-400">{check.detail}</span>
                      </div>
                    ))}
                  </div>

                  {/* JSON viewer */}
                  <div className="rounded-lg bg-slate-900 p-4 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[360px]">
                    <pre>{JSON.stringify(selectedResource, null, 2)}</pre>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="card p-12 text-center text-xs text-slate-400">
                Select a FHIR resource on the left to inspect its structure and conformance.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: CDISC SDTM / ADaM */}
      {tab === 'sdtm' && (
        <div className="space-y-5">
          {/* Conformance Summary */}
          <div className="card p-4 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white border-emerald-200">
            <div>
              <h3 className="font-bold text-sm text-emerald-950">
                CDISC Conformance Validation (SDTMIG v3.4 / ADaMIG v1.3)
              </h3>
              <p className="text-xs text-slate-600">
                Validated <b>{allDatasets.length} datasets</b>. Conformance result:{' '}
                <b>{conformanceIssues.filter((i) => i.level === 'error').length} Errors</b>,{' '}
                <b>{conformanceIssues.filter((i) => i.level === 'warning').length} Warnings</b>.
              </p>
            </div>
            <button
              onClick={() => {
                const xml = defineXML(allDatasets);
                download(`define-2.1-${selectedStudyId}.xml`, xml, 'application/xml');
              }}
              className="btn-primary text-xs"
            >
              <Download size={13} /> Download Define-XML 2.1
            </button>
          </div>

          {/* Datasets Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {allDatasets.map((ds) => (
              <Card
                key={ds.name}
                title={
                  <div className="flex items-center justify-between w-full">
                    <span className="mono font-bold text-brand-900">{ds.name} · {ds.label}</span>
                    <Badge tone={ds.cls === 'SDTM' ? 'brand' : 'violet'}>{ds.cls}</Badge>
                  </div>
                }
                actions={
                  <button
                    onClick={() => {
                      const csv = toCSV(ds);
                      download(`${ds.name.toLowerCase()}_${selectedStudyId}.csv`, csv, 'text/csv');
                    }}
                    className="btn-ghost text-xs py-1 px-2"
                  >
                    <Download size={12} /> CSV
                  </button>
                }
              >
                <div className="space-y-2 text-xs">
                  <div className="text-slate-500">
                    Records: <b>{ds.rows.length}</b> | Variables: <b>{ds.vars.length}</b> ({ds.vars.map((v) => v.name).join(', ')})
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-slate-100 rounded">
                    <table className="tbl text-[11px]">
                      <thead>
                        <tr>
                          {ds.vars.slice(0, 5).map((v) => (
                            <th key={v.name}>{v.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ds.rows.slice(0, 5).map((r, i) => (
                          <tr key={i}>
                            {ds.vars.slice(0, 5).map((v) => (
                              <td key={v.name} className="mono truncate max-w-[100px]">
                                {String(r[v.name] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: CTRI & EC Regulatory Packets */}
      {tab === 'packets' && (
        <div id="tour-packet" className="grid gap-6 md:grid-cols-2">
          {/* CTRI Dossier */}
          <Card
            title="Clinical Trials Registry - India (CTRI) Packet"
            actions={
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const html = packetHTML(`CTRI Update Dossier · ${selectedStudy.code}`, ctriPack.body, ctriPack.hash);
                    download(`CTRI_${selectedStudy.code}.html`, html, 'text/html');
                    markCtriUpdated(selectedStudy.id);
                  }}
                  className="btn-primary text-xs py-1 px-2.5"
                >
                  <Download size={13} /> HTML Dossier
                </button>
                <button
                  onClick={() => {
                    download(`CTRI_${selectedStudy.code}.json`, ctriPack.json, 'application/json');
                    markCtriUpdated(selectedStudy.id);
                  }}
                  className="btn-ghost text-xs py-1 px-2.5"
                >
                  <Download size={13} /> JSON
                </button>
              </div>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="rounded bg-slate-50 p-3 border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-800">
                  WHO TRDS 24-Item Dataset for {selectedStudy.ctriNo}
                </div>
                <div className="text-[11px] text-slate-500">
                  Includes multi-site recruitment rates, ASU botanical formulation identity, and safety metrics.
                </div>
                <div className="mono text-[10px] text-brand-900 pt-1">
                  SHA-256 Checksum: <b>{ctriPack.hash.slice(0, 32)}...</b>
                </div>
              </div>
              <div className="rounded bg-slate-900 p-3 text-emerald-400 font-mono text-[11px] max-h-64 overflow-y-auto">
                <pre>{ctriPack.json}</pre>
              </div>
            </div>
          </Card>

          {/* Ethics Committee Continuing Review Dossier */}
          <Card
            title="Ethics Committee Continuing Review Dossier"
            actions={
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const html = packetHTML(`Ethics Review Dossier · ${selectedStudy.code}`, ecPack.body, ecPack.hash);
                    download(`IEC_${selectedStudy.code}.html`, html, 'text/html');
                  }}
                  className="btn-primary text-xs py-1 px-2.5"
                >
                  <Download size={13} /> HTML Dossier
                </button>
                <button
                  onClick={() => {
                    download(`IEC_${selectedStudy.code}.json`, ecPack.json, 'application/json');
                  }}
                  className="btn-ghost text-xs py-1 px-2.5"
                >
                  <Download size={13} /> JSON
                </button>
              </div>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="rounded bg-slate-50 p-3 border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-800">
                  Annual Continuing Review Packet for {selectedStudy.ecName}
                </div>
                <div className="text-[11px] text-slate-500">
                  Includes serious adverse event line listings, protocol deviation CAPAs, and consent status.
                </div>
                <div className="mono text-[10px] text-violet-900 pt-1">
                  SHA-256 Checksum: <b>{ecPack.hash.slice(0, 32)}...</b>
                </div>
              </div>
              <div className="rounded bg-slate-900 p-3 text-emerald-400 font-mono text-[11px] max-h-64 overflow-y-auto">
                <pre>{ecPack.json}</pre>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
