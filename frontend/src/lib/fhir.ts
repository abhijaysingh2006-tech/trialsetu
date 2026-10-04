// FHIR R4 mappers + lightweight structural validation (in-browser).
// Phase 2: resources are POSTed to HAPI FHIR R4 (docker-compose `hapi`) and validated
// with `$validate` against an AIIA IG (profiles for ASU formulation & NAMASTE codings).

import type { AdverseEvent, Batch, Formulation, Participant, Study } from './types';

export type FhirResource = Record<string, unknown> & { resourceType: string; id: string };

const SYS = {
  pseudonym: 'urn:oid:2.16.356.aiia.trialsetu.pseudonym', // illustrative OID arc
  ctri: 'https://ctri.nic.in',
  namaste: 'https://namaste.ayush.gov.in/CodeSystem/namaste', // illustrative
  meddra: 'http://terminology.hl7.org/CodeSystem/MDRAE',
  tm2: 'http://id.who.int/icd/release/11/mms',
};

const statusMap: Record<Study['status'], string> = {
  Recruiting: 'active', 'Active, not recruiting': 'closed-to-accrual', Completed: 'completed', 'EC approval pending': 'in-review', Suspended: 'temporarily-closed-to-accrual',
};

export function researchStudy(s: Study, f?: Formulation): FhirResource {
  return {
    resourceType: 'ResearchStudy', id: s.id,
    identifier: [{ system: SYS.ctri, value: s.ctriNo }, { system: 'urn:aiia:protocol', value: s.code }],
    title: s.title, status: statusMap[s.status],
    phase: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/research-study-phase', code: ({ 'Phase II': 'phase-2', 'Phase III': 'phase-3', 'Phase IV': 'phase-4', 'Phase II/III': 'phase-2-phase-3' } as const)[s.phase], display: s.phase }] },
    condition: [{ text: `${s.ayurvedaCondition} (${s.condition})` }],
    description: s.design,
    period: { start: s.startDate, end: s.plannedEndDate },
    sponsor: { display: s.sponsor },
    principalInvestigator: { display: s.piName },
    site: s.sites.map((x) => ({ reference: `Location/${x.siteId}` })),
    extension: [{ url: 'urn:aiia:fhir:StructureDefinition/asu-formulation', valueString: f?.name ?? s.formulationId }],
  };
}

export function patient(p: Participant): FhirResource {
  // Pseudonymised: no name/telecom/address/birthDate — only pseudonym + coarse demographics.
  return {
    resourceType: 'Patient', id: p.id,
    identifier: [{ system: SYS.pseudonym, value: p.vaultToken }],
    gender: p.sex === 'F' ? 'female' : 'male',
    extension: [{ url: 'urn:aiia:fhir:StructureDefinition/age-band', valueString: `${Math.floor(p.age / 10) * 10}-${Math.floor(p.age / 10) * 10 + 9}` }],
    meta: { security: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationValue', code: 'PSEUDED' }] },
  };
}

export function researchSubject(p: Participant): FhirResource {
  return {
    resourceType: 'ResearchSubject', id: `RS-${p.id}`,
    status: p.status === 'Withdrawn' ? 'withdrawn' : p.status === 'Completed' ? 'off-study' : 'on-study',
    study: { reference: `ResearchStudy/${p.studyId}` }, individual: { reference: `Patient/${p.id}` },
    assignedArm: p.arm, period: { start: p.enrolledOn },
    consent: { reference: `Consent/CN-${p.id}` },
  };
}

export function medication(b: Batch, f?: Formulation): FhirResource {
  return {
    resourceType: 'Medication', id: b.id,
    code: { text: f?.name ?? b.formulationId },
    form: { text: f?.dosageForm },
    ingredient: (f?.ingredients ?? '').split(',').map((x) => ({ itemCodeableConcept: { text: x.trim() } })),
    batch: { lotNumber: b.batchNo, expirationDate: b.expiryDate },
    manufacturer: { display: b.manufacturer },
  };
}

export function adverseEvent(ae: AdverseEvent): FhirResource {
  const sevMap = { Mild: 'mild', Moderate: 'moderate', Severe: 'severe' } as const;
  const coding: Record<string, string>[] = [];
  if (ae.meddraPT) coding.push({ system: SYS.meddra, display: ae.meddraPT });
  if (ae.namasteTerm) coding.push({ system: SYS.namaste, display: ae.namasteTerm });
  return {
    resourceType: 'AdverseEvent', id: ae.id,
    actuality: 'actual',
    category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/adverse-event-category', code: 'medication-mishap', display: 'Medication Mishap' }] }],
    event: { coding, text: ae.verbatim },
    subject: { reference: `Patient/${ae.participantId}` },
    date: ae.onsetAt, detected: ae.onsetAt, recordedDate: ae.awareAt,
    seriousness: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/adverse-event-seriousness', code: ae.serious ? 'serious' : 'non-serious' }] },
    severity: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/adverse-event-severity', code: sevMap[ae.severity] }] },
    outcome: { text: ae.outcome },
    study: [{ reference: `ResearchStudy/${ae.studyId}` }],
    suspectEntity: ae.batchId ? [{ instance: { reference: `Medication/${ae.batchId}` }, causality: [{ assessment: { text: `WHO-UMC: ${ae.causality}` } }] }] : [],
  };
}

export interface ValidationCheck { id: string; label: string; pass: boolean; detail: string; level: 'error' | 'warning' }

const REQUIRED: Record<string, string[]> = {
  ResearchStudy: ['status'], ResearchSubject: ['status', 'study', 'individual'], Patient: [], Medication: [], AdverseEvent: ['actuality', 'subject'],
};

export function validate(r: FhirResource, known: Set<string>): ValidationCheck[] {
  const out: ValidationCheck[] = [];
  out.push({ id: 'type', label: 'resourceType is a valid R4 type', pass: r.resourceType in REQUIRED, detail: r.resourceType, level: 'error' });
  out.push({ id: 'id', label: 'id matches [A-Za-z0-9\\-\\.]{1,64}', pass: /^[A-Za-z0-9\-.]{1,64}$/.test(r.id), detail: r.id, level: 'error' });
  for (const f of REQUIRED[r.resourceType] ?? []) out.push({ id: `req:${f}`, label: `Required element ${r.resourceType}.${f} (1..1)`, pass: r[f] !== undefined && r[f] !== '', detail: r[f] === undefined ? 'missing' : 'present', level: 'error' });
  const refs: string[] = [];
  JSON.stringify(r, (k, v) => { if (k === 'reference' && typeof v === 'string') refs.push(v); return v; });
  const unresolved = refs.filter((x) => !known.has(x) && !x.startsWith('Location/') && !x.startsWith('Consent/'));
  out.push({ id: 'refs', label: 'All references resolve within bundle', pass: unresolved.length === 0, detail: unresolved.length ? `Unresolved: ${unresolved.join(', ')}` : `${refs.length} reference(s) OK`, level: 'error' });
  const dates: string[] = [];
  JSON.stringify(r, (k, v) => { if (/date|start|end|detected|expirationDate/i.test(k) && typeof v === 'string') dates.push(v); return v; });
  out.push({ id: 'dates', label: 'Dates are ISO-8601 (FHIR date/dateTime)', pass: dates.every((d) => /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/.test(d)), detail: `${dates.length} date(s) checked`, level: 'error' });
  if (r.resourceType === 'Patient') {
    const direct = ['name', 'telecom', 'address', 'birthDate', 'photo'].filter((k) => k in r);
    out.push({ id: 'pseudo', label: 'No direct identifiers (DPDP / pseudonymisation)', pass: direct.length === 0, detail: direct.length ? direct.join(',') : 'name/telecom/address/birthDate absent', level: 'error' });
  }
  if (r.resourceType === 'AdverseEvent') {
    const ev = r.event as { coding: { system: string }[] };
    out.push({ id: 'meddra', label: 'Event coded with MedDRA', pass: ev.coding.some((c) => c.system.includes('MDRAE')), detail: ev.coding.some((c) => c.system.includes('MDRAE')) ? 'MedDRA coding present' : 'Uncoded — pending in coding queue', level: 'warning' });
    out.push({ id: 'batch', label: 'suspectEntity links to formulation batch (Medication.batch.lotNumber)', pass: (r.suspectEntity as unknown[]).length > 0, detail: (r.suspectEntity as unknown[]).length ? 'Batch-linked' : 'No batch (control arm)', level: 'warning' });
  }
  return out;
}

export function bundle(resources: FhirResource[]): FhirResource {
  return {
    resourceType: 'Bundle', id: `bundle-${Date.now()}`, type: 'collection', timestamp: new Date().toISOString(),
    entry: resources.map((r) => ({ fullUrl: `urn:uuid:${r.resourceType}-${r.id}`, resource: r })),
  };
}
