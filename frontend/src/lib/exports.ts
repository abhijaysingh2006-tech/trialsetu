// CDISC SDTM / ADaM / Define-XML generation + CTRI & EC packet generators.
// Datasets are generated for real (CSV); SAS XPT v5 transport and full Pinnacle 21
// conformance are Phase 3 (backend job). Checks below are a subset of SDTMIG 3.4 rules.

import { sha256 } from './sha256';
import type { Clock } from './rules';
import type { AdverseEvent, Deviation, Formulation, Participant, Site, Study, Visit, Batch } from './types';

export type Row = Record<string, string | number>;
export interface Dataset { name: string; label: string; cls: 'SDTM' | 'ADaM'; vars: { name: string; label: string; type: 'Char' | 'Num'; required: boolean }[]; rows: Row[] }

const SID = 'AIIA-TS';
const usub = (p: { studyId: string; id: string }) => `${SID}-${p.id}`;

export function buildSDTM(studies: Study[], participants: Participant[], aes: AdverseEvent[], visits: Visit[], studyFilter?: string): Dataset[] {
  const ps = participants.filter((p) => !studyFilter || p.studyId === studyFilter);
  const pset = new Set(ps.map((p) => p.id));
  const DM: Dataset = {
    name: 'DM', label: 'Demographics', cls: 'SDTM',
    vars: [
      { name: 'STUDYID', label: 'Study Identifier', type: 'Char', required: true }, { name: 'DOMAIN', label: 'Domain Abbreviation', type: 'Char', required: true },
      { name: 'USUBJID', label: 'Unique Subject Identifier', type: 'Char', required: true }, { name: 'SUBJID', label: 'Subject Identifier for the Study', type: 'Char', required: true },
      { name: 'SITEID', label: 'Study Site Identifier', type: 'Char', required: true }, { name: 'RFSTDTC', label: 'Subject Reference Start Date/Time', type: 'Char', required: false },
      { name: 'AGE', label: 'Age', type: 'Num', required: false }, { name: 'AGEU', label: 'Age Units', type: 'Char', required: false },
      { name: 'SEX', label: 'Sex', type: 'Char', required: true }, { name: 'ARM', label: 'Description of Planned Arm', type: 'Char', required: true }, { name: 'COUNTRY', label: 'Country', type: 'Char', required: true },
    ],
    rows: ps.map((p) => ({ STUDYID: p.studyId, DOMAIN: 'DM', USUBJID: usub(p), SUBJID: p.id.split('-').pop()!, SITEID: p.siteId, RFSTDTC: p.enrolledOn, AGE: p.age, AGEU: 'YEARS', SEX: p.sex, ARM: p.arm.toUpperCase(), COUNTRY: 'IND' })),
  };
  const seqBy: Record<string, number> = {};
  const AE: Dataset = {
    name: 'AE', label: 'Adverse Events', cls: 'SDTM',
    vars: [
      { name: 'STUDYID', label: 'Study Identifier', type: 'Char', required: true }, { name: 'DOMAIN', label: 'Domain Abbreviation', type: 'Char', required: true },
      { name: 'USUBJID', label: 'Unique Subject Identifier', type: 'Char', required: true }, { name: 'AESEQ', label: 'Sequence Number', type: 'Num', required: true },
      { name: 'AETERM', label: 'Reported Term for the Adverse Event', type: 'Char', required: true }, { name: 'AEDECOD', label: 'Dictionary-Derived Term', type: 'Char', required: true },
      { name: 'AEBODSYS', label: 'Body System or Organ Class', type: 'Char', required: false }, { name: 'AESEV', label: 'Severity/Intensity', type: 'Char', required: false },
      { name: 'AESER', label: 'Serious Event', type: 'Char', required: false }, { name: 'AEREL', label: 'Causality', type: 'Char', required: false },
      { name: 'AEOUT', label: 'Outcome of Adverse Event', type: 'Char', required: false }, { name: 'AESTDTC', label: 'Start Date/Time of Adverse Event', type: 'Char', required: false },
      { name: 'SUPPAE.NAMASTE', label: 'NAMASTE term (supplemental qualifier)', type: 'Char', required: false }, { name: 'SUPPAE.BATCH', label: 'IP batch / lot number (supplemental)', type: 'Char', required: false },
    ],
    rows: aes.filter((a) => pset.has(a.participantId)).map((a) => {
      seqBy[a.participantId] = (seqBy[a.participantId] ?? 0) + 1;
      return { STUDYID: a.studyId, DOMAIN: 'AE', USUBJID: `${SID}-${a.participantId}`, AESEQ: seqBy[a.participantId], AETERM: a.verbatim, AEDECOD: a.meddraPT ?? '', AEBODSYS: a.meddraSOC ?? '', AESEV: a.severity.toUpperCase(), AESER: a.serious ? 'Y' : 'N', AEREL: a.causality.toUpperCase(), AEOUT: a.outcome.toUpperCase(), AESTDTC: a.onsetAt.slice(0, 16), 'SUPPAE.NAMASTE': a.namasteTerm ?? '', 'SUPPAE.BATCH': a.batchId ?? '' };
    }),
  };
  const vsSeq: Record<string, number> = {};
  const VS: Dataset = {
    name: 'VS', label: 'Vital Signs', cls: 'SDTM',
    vars: [
      { name: 'STUDYID', label: 'Study Identifier', type: 'Char', required: true }, { name: 'DOMAIN', label: 'Domain Abbreviation', type: 'Char', required: true },
      { name: 'USUBJID', label: 'Unique Subject Identifier', type: 'Char', required: true }, { name: 'VSSEQ', label: 'Sequence Number', type: 'Num', required: true },
      { name: 'VSTESTCD', label: 'Vital Signs Test Short Name', type: 'Char', required: true }, { name: 'VSTEST', label: 'Vital Signs Test Name', type: 'Char', required: true },
      { name: 'VSORRES', label: 'Result or Finding in Original Units', type: 'Char', required: false }, { name: 'VSORRESU', label: 'Original Units', type: 'Char', required: false },
      { name: 'VISIT', label: 'Visit Name', type: 'Char', required: false }, { name: 'VSDTC', label: 'Date/Time of Measurements', type: 'Char', required: false },
    ],
    rows: visits.filter((v) => pset.has(v.participantId) && v.actual).flatMap((v) => ([['SYSBP', 'Systolic Blood Pressure', v.sbp, 'mmHg'], ['DIABP', 'Diastolic Blood Pressure', v.dbp, 'mmHg'], ['WEIGHT', 'Weight', v.weight, 'kg']] as const).map(([cd, t, val, u]) => {
      vsSeq[v.participantId] = (vsSeq[v.participantId] ?? 0) + 1;
      return { STUDYID: v.studyId, DOMAIN: 'VS', USUBJID: `${SID}-${v.participantId}`, VSSEQ: vsSeq[v.participantId], VSTESTCD: cd, VSTEST: t, VSORRES: val ?? '', VSORRESU: u, VISIT: v.visitName.toUpperCase(), VSDTC: v.actual! };
    })),
  };
  const EX: Dataset = {
    name: 'EX', label: 'Exposure', cls: 'SDTM',
    vars: [
      { name: 'STUDYID', label: 'Study Identifier', type: 'Char', required: true }, { name: 'DOMAIN', label: 'Domain Abbreviation', type: 'Char', required: true },
      { name: 'USUBJID', label: 'Unique Subject Identifier', type: 'Char', required: true }, { name: 'EXSEQ', label: 'Sequence Number', type: 'Num', required: true },
      { name: 'EXTRT', label: 'Name of Treatment', type: 'Char', required: true }, { name: 'EXLOT', label: 'Lot Number', type: 'Char', required: false }, { name: 'EXSTDTC', label: 'Start Date/Time of Treatment', type: 'Char', required: false },
    ],
    rows: ps.filter((p) => p.batchId).map((p) => ({ STUDYID: p.studyId, DOMAIN: 'EX', USUBJID: usub(p), EXSEQ: 1, EXTRT: studies.find((s) => s.id === p.studyId)!.formulationId, EXLOT: p.batchId!, EXSTDTC: p.enrolledOn })),
  };
  return [DM, AE, EX, VS];
}

export function buildADaM(sdtm: Dataset[], participants: Participant[]): Dataset[] {
  const dm = sdtm.find((d) => d.name === 'DM')!;
  const ae = sdtm.find((d) => d.name === 'AE')!;
  const pMap = new Map(participants.map((p) => [`${SID}-${p.id}`, p]));
  const ADSL: Dataset = {
    name: 'ADSL', label: 'Subject-Level Analysis Dataset', cls: 'ADaM',
    vars: ['STUDYID', 'USUBJID', 'SITEID', 'AGE', 'AGEGR1', 'SEX', 'TRT01P', 'SAFFL', 'ITTFL', 'TRTSDT'].map((n) => ({ name: n, label: n, type: n === 'AGE' ? 'Num' : 'Char', required: ['STUDYID', 'USUBJID'].includes(n) })),
    rows: dm.rows.map((r) => ({ STUDYID: r.STUDYID, USUBJID: r.USUBJID, SITEID: r.SITEID, AGE: r.AGE, AGEGR1: Number(r.AGE) >= 65 ? '>=65' : Number(r.AGE) >= 40 ? '40-64' : '<40', SEX: r.SEX, TRT01P: r.ARM, SAFFL: 'Y', ITTFL: 'Y', TRTSDT: r.RFSTDTC })),
  };
  const ADAE: Dataset = {
    name: 'ADAE', label: 'Adverse Events Analysis Dataset', cls: 'ADaM',
    vars: ['STUDYID', 'USUBJID', 'AESEQ', 'AEDECOD', 'AEBODSYS', 'AESEV', 'AESER', 'TRTA', 'TRTEMFL', 'ASTDT', 'BATCH'].map((n) => ({ name: n, label: n, type: n === 'AESEQ' ? 'Num' : 'Char', required: ['STUDYID', 'USUBJID', 'AESEQ'].includes(n) })),
    rows: ae.rows.map((r) => ({ STUDYID: r.STUDYID, USUBJID: r.USUBJID, AESEQ: r.AESEQ, AEDECOD: r.AEDECOD, AEBODSYS: r.AEBODSYS, AESEV: r.AESEV, AESER: r.AESER, TRTA: pMap.get(String(r.USUBJID))?.arm.toUpperCase() ?? '', TRTEMFL: 'Y', ASTDT: String(r.AESTDTC).slice(0, 10), BATCH: r['SUPPAE.BATCH'] })),
  };
  return [ADSL, ADAE];
}

export interface ConformanceIssue { dataset: string; rule: string; level: 'error' | 'warning'; count: number; message: string }

export function checkConformance(ds: Dataset[]): ConformanceIssue[] {
  const issues: ConformanceIssue[] = [];
  const iso = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?$/;
  for (const d of ds) {
    for (const v of d.vars.filter((x) => x.required)) {
      const missing = d.rows.filter((r) => r[v.name] === '' || r[v.name] === undefined).length;
      if (missing) issues.push({ dataset: d.name, rule: v.name === 'AEDECOD' ? 'SD0002 (AEDECOD null)' : 'SD0002', level: v.name === 'AEDECOD' ? 'warning' : 'error', count: missing, message: `${v.name} is required but null in ${missing} record(s)${v.name === 'AEDECOD' ? ' — complete MedDRA coding in the Terminology Bridge' : ''}` });
    }
    const dtcVars = d.vars.filter((v) => /DTC$/.test(v.name));
    for (const v of dtcVars) {
      const bad = d.rows.filter((r) => r[v.name] && !iso.test(String(r[v.name]))).length;
      if (bad) issues.push({ dataset: d.name, rule: 'SD0003 ISO 8601', level: 'error', count: bad, message: `${v.name} not ISO 8601 in ${bad} record(s)` });
    }
    if (d.name === 'AE') {
      const badSev = d.rows.filter((r) => r.AESEV && !['MILD', 'MODERATE', 'SEVERE'].includes(String(r.AESEV))).length;
      if (badSev) issues.push({ dataset: 'AE', rule: 'CT2001 AESEV codelist', level: 'error', count: badSev, message: 'AESEV outside controlled terminology' });
      const badSer = d.rows.filter((r) => !['Y', 'N'].includes(String(r.AESER))).length;
      if (badSer) issues.push({ dataset: 'AE', rule: 'CT2001 NY codelist', level: 'error', count: badSer, message: 'AESER outside NY codelist' });
    }
    if (d.cls === 'SDTM') {
      const keys = new Set<string>();
      const seqVar = d.vars.find((v) => /SEQ$/.test(v.name))?.name;
      if (seqVar) {
        let dup = 0;
        d.rows.forEach((r) => { const k = `${r.USUBJID}|${r[seqVar]}`; if (keys.has(k)) dup++; keys.add(k); });
        if (dup) issues.push({ dataset: d.name, rule: 'SD0005 unique --SEQ', level: 'error', count: dup, message: `Duplicate ${seqVar} within USUBJID` });
      }
    }
  }
  return issues;
}

export function toCSV(d: Dataset): string {
  const esc = (v: string | number) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return [d.vars.map((v) => v.name).join(','), ...d.rows.map((r) => d.vars.map((v) => esc(r[v.name] ?? '')).join(','))].join('\n');
}

export function defineXML(ds: Dataset[]): string {
  const x = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const itemDefs = new Map<string, { label: string; type: string }>();
  ds.forEach((d) => d.vars.forEach((v) => itemDefs.set(`IT.${d.name}.${v.name}`, { label: v.label, type: v.type === 'Num' ? 'integer' : 'text' })));
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Define-XML 2.1 (abridged, generated by TrialSetu prototype — synthetic data) -->
<ODM xmlns="http://www.cdisc.org/ns/odm/v1.3" xmlns:def="http://www.cdisc.org/ns/def/v2.1" ODMVersion="1.3.2" FileType="Snapshot" FileOID="TS.DEFINE.${Date.now()}" CreationDateTime="${new Date().toISOString()}">
  <Study OID="ST.${SID}">
    <GlobalVariables><StudyName>${SID}</StudyName><StudyDescription>AIIA Ayurveda portfolio (synthetic)</StudyDescription><ProtocolName>${SID}</ProtocolName></GlobalVariables>
    <MetaDataVersion OID="MDV.1" Name="TrialSetu MDV" def:DefineVersion="2.1.0">
      <def:Standards><def:Standard OID="STD.1" Name="SDTMIG" Type="IG" Version="3.4"/><def:Standard OID="STD.2" Name="ADaMIG" Type="IG" Version="1.3"/></def:Standards>
${ds.map((d) => `      <ItemGroupDef OID="IG.${d.name}" Name="${d.name}" Repeating="${d.name === 'DM' || d.name === 'ADSL' ? 'No' : 'Yes'}" def:Structure="${d.name === 'DM' || d.name === 'ADSL' ? 'One record per subject' : 'One record per event per subject'}" def:Class="${d.cls === 'ADaM' ? (d.name === 'ADSL' ? 'SUBJECT LEVEL ANALYSIS DATASET' : 'OCCURRENCE DATA STRUCTURE') : d.name === 'AE' ? 'EVENTS' : d.name === 'DM' ? 'SPECIAL PURPOSE' : d.name === 'EX' ? 'INTERVENTIONS' : 'FINDINGS'}" def:StandardOID="${d.cls === 'SDTM' ? 'STD.1' : 'STD.2'}">
        <Description><TranslatedText xml:lang="en">${x(d.label)}</TranslatedText></Description>
${d.vars.map((v, i) => `        <ItemRef ItemOID="IT.${d.name}.${v.name}" OrderNumber="${i + 1}" Mandatory="${v.required ? 'Yes' : 'No'}"/>`).join('\n')}
      </ItemGroupDef>`).join('\n')}
${Array.from(itemDefs.entries()).map(([oid, v]) => `      <ItemDef OID="${oid}" Name="${oid.split('.').pop()}" DataType="${v.type}"><Description><TranslatedText xml:lang="en">${x(v.label)}</TranslatedText></Description></ItemDef>`).join('\n')}
    </MetaDataVersion>
  </Study>
</ODM>`;
}

export function download(filename: string, content: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ---------------- Regulatory packets ----------------
export interface PacketCtx {
  study: Study; sites: Site[]; participants: Participant[]; aes: AdverseEvent[]; deviations: Deviation[]; clocks: Clock[];
  formulation?: Formulation; batches: Batch[]; preparedBy: string; role: string;
}

export function ctriPacket(c: PacketCtx) {
  const s = c.study;
  const enrolledBySite = s.sites.map((ss) => ({ site: c.sites.find((x) => x.id === ss.siteId)?.name ?? ss.siteId, pi: ss.piName, target: ss.target, enrolled: c.participants.filter((p) => p.siteId === ss.siteId).length }));
  const body = {
    packetType: 'CTRI Trial Record Update', generatedAt: new Date().toISOString(), preparedBy: `${c.preparedBy} (${c.role})`,
    ctriNumber: s.ctriNo, protocol: s.code, publicTitle: s.title, scientificTitle: `${s.design} trial of ${c.formulation?.name} in ${s.ayurvedaCondition} (${s.condition})`,
    phase: s.phase, recruitmentStatusIndia: s.status, dateOfFirstEnrolment: s.enrolmentHistory.find((h) => h.cumulative > 0)?.month ?? 'Not yet', targetSampleSize: s.target,
    actualEnrolment: c.participants.length, sites: enrolledBySite,
    intervention: { name: c.formulation?.name, form: c.formulation?.dosageForm, composition: c.formulation?.ingredients, classicalReference: c.formulation?.reference, batches: c.batches.map((b) => b.batchNo) },
    ethicsCommittee: { name: s.ecName, approvalDate: s.ecApprovalDate, validUntil: s.ecExpiryDate, status: s.ecRenewalStatus },
    safetySummary: { totalAEs: c.aes.length, serious: c.aes.filter((a) => a.serious).length, saeClocksOpen: c.clocks.filter((k) => k.appliesTo === 'SAE' && !k.stoppedAt).length },
    lastCtriUpdate: s.ctriLastUpdated, note: 'Synthetic demo packet — field set aligned to CTRI trial-registration dataset (WHO TRDS 24 items, abridged).',
  };
  const json = JSON.stringify(body, null, 2);
  return { body, json, hash: sha256(json) };
}

export function ecPacket(c: PacketCtx) {
  const s = c.study;
  const consentIssues = c.participants.filter((p) => p.consentStatus !== 'Granted').length;
  const body = {
    packetType: 'Ethics Committee Continuing Review / Safety Packet', generatedAt: new Date().toISOString(), preparedBy: `${c.preparedBy} (${c.role})`,
    committee: s.ecName, protocol: s.code, title: s.title, approvalDate: s.ecApprovalDate, expiry: s.ecExpiryDate, renewalStatus: s.ecRenewalStatus,
    enrolment: { target: s.target, enrolled: c.participants.length, withdrawn: c.participants.filter((p) => p.status === 'Withdrawn').length },
    consent: { currentVersion: 'v2.1', onOlderVersion: c.participants.filter((p) => p.consentVersion !== 'v2.1').length, withdrawnOrReconsent: consentIssues },
    saes: c.aes.filter((a) => a.serious).map((a) => ({ id: a.id, term: a.meddraPT ?? a.verbatim, causality: a.causality, initialReport: a.reportedAt ?? 'PENDING', analysisReport: a.analysisReportedAt ?? 'PENDING', ecOpinion: a.ecOpinionAt ?? 'PENDING' })),
    deviations: c.deviations.map((d) => ({ id: d.id, category: d.category, severity: d.severity, status: d.status })),
    statutoryClocks: c.clocks.map((k) => ({ rule: k.ruleId, item: k.label, due: new Date(k.dueAt).toISOString(), status: k.status })),
  };
  const json = JSON.stringify(body, null, 2);
  return { body, json, hash: sha256(json) };
}

export function packetHTML(title: string, body: Record<string, unknown>, hash: string): string {
  const render = (v: unknown): string => {
    if (Array.isArray(v)) return v.length && typeof v[0] === 'object'
      ? `<table><thead><tr>${Object.keys(v[0] as object).map((k) => `<th>${k}</th>`).join('')}</tr></thead><tbody>${v.map((r) => `<tr>${Object.values(r as object).map((x) => `<td>${String(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
      : v.join(', ');
    if (v && typeof v === 'object') return `<dl>${Object.entries(v).map(([k, x]) => `<dt>${k}</dt><dd>${render(x)}</dd>`).join('')}</dl>`;
    return String(v ?? '');
  };
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>
body{font-family:Segoe UI,system-ui,sans-serif;max-width:900px;margin:32px auto;color:#15423b}h1{color:#196256;border-bottom:3px solid #e69a14;padding-bottom:8px}
dl{display:grid;grid-template-columns:240px 1fr;gap:6px 16px}dt{font-weight:600;color:#475569}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #cbd5e1;padding:4px 8px;text-align:left}th{background:#effaf7}
.foot{margin-top:24px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:8px}.syn{background:#fff9eb;border:1px solid #f5b83d;padding:6px 10px;border-radius:6px;font-size:12px}
</style></head><body><p class="syn">SYNTHETIC DEMO DATA — generated by TrialSetu (SIH26046 prototype)</p><h1>${title}</h1>${render(body)}
<div class="foot">Packet SHA-256: <code>${hash}</code><br/>Integrity: this hash is recorded in the TrialSetu append-only audit chain.</div></body></html>`;
}
