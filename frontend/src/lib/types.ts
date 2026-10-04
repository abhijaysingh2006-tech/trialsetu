// Core domain model for TrialSetu. Mirrors backend/app/models.py (FastAPI) so the
// mock data source and the HTTP data source are interchangeable.

export type RoleId = 'investigator' | 'ethics' | 'pv' | 'leadership';

export interface User {
  id: string;
  name: string;
  role: RoleId;
  title: string;
  siteId?: string;
  studyIds?: string[]; // investigator scope
}

export type StudyStatus =
  | 'Recruiting'
  | 'Active, not recruiting'
  | 'Completed'
  | 'EC approval pending'
  | 'Suspended';

export interface Site {
  id: string;
  name: string;
  city: string;
  state: string;
}

export interface StudySite {
  siteId: string;
  piName: string;
  target: number;
  activatedOn: string; // ISO date
}

export interface Formulation {
  id: string;
  name: string;
  nameHi: string;
  dosageForm: string;
  ingredients: string;
  reference: string; // classical text reference
}

export interface Batch {
  id: string;
  formulationId: string;
  batchNo: string;
  manufacturer: string;
  mfgDate: string;
  expiryDate: string;
  qcStatus: 'Released' | 'Under investigation' | 'Quarantined';
  heavyMetalsPass: boolean;
  microbialPass: boolean;
  unitsDispensed: number;
}

export interface Study {
  id: string;
  code: string;
  title: string;
  titleHi: string;
  ayurvedaCondition: string; // Ayurveda diagnosis name
  condition: string; // biomedical correlate
  formulationId: string;
  phase: 'Phase II' | 'Phase III' | 'Phase IV' | 'Phase II/III';
  status: StudyStatus;
  ctriNo: string;
  ctriLastUpdated: string;
  ctriStatusChangedOn?: string;
  sponsor: string;
  piName: string;
  sites: StudySite[];
  target: number;
  startDate: string;
  plannedEndDate: string;
  ecName: string;
  ecApprovalDate: string;
  ecExpiryDate: string;
  ecRenewalStatus: 'Approved' | 'Renewal submitted' | 'Renewal due' | 'Lapsed' | 'Pending initial';
  design: string;
  /** month-wise cumulative enrolment, oldest first (YYYY-MM, n) */
  enrolmentHistory: { month: string; cumulative: number }[];
}

export interface Participant {
  id: string; // pseudonymised subject ID shown in UI
  vaultToken: string; // opaque pointer to identity vault
  studyId: string;
  siteId: string;
  arm: 'Intervention' | 'Control';
  sex: 'F' | 'M';
  age: number;
  enrolledOn: string;
  status: 'Screening' | 'Enrolled' | 'Completed' | 'Withdrawn';
  batchId: string | null;
  consentVersion: string;
  consentStatus: 'Granted' | 'Withdrawn' | 'Re-consent required';
  consentPurposes: { trial: boolean; pvSharing: boolean; futureResearch: boolean };
  consentLanguage: 'English' | 'Hindi';
  consentedAt: string;
}

export type Severity = 'Mild' | 'Moderate' | 'Severe';
export type Causality = 'Certain' | 'Probable' | 'Possible' | 'Unlikely' | 'Unassessable';
export type SeriousCriterion =
  | 'Death'
  | 'Life-threatening'
  | 'Hospitalisation'
  | 'Disability'
  | 'Congenital anomaly'
  | 'Other medically important';

export interface AdverseEvent {
  id: string;
  participantId: string;
  studyId: string;
  siteId: string;
  batchId: string | null;
  verbatim: string;
  namasteTerm?: string;
  meddraPT?: string;
  meddraSOC?: string;
  codingStatus: 'Uncoded' | 'Suggested' | 'Coded';
  severity: Severity;
  serious: boolean;
  seriousCriteria?: SeriousCriterion[];
  causality: Causality;
  outcome: 'Recovering' | 'Recovered' | 'Not recovered' | 'Fatal' | 'Unknown';
  onsetAt: string;
  awareAt: string; // investigator awareness (clock start)
  reportedAt?: string; // initial report submitted (24h clock)
  analysisReportedAt?: string; // 14-day analysis
  ecOpinionAt?: string;
  status: 'Open' | 'Initial reported' | 'Under analysis' | 'Closed';
  narrative?: string;
}

export interface Deviation {
  id: string;
  studyId: string;
  siteId: string;
  participantId: string;
  category: 'Visit window' | 'Eligibility' | 'IP dosing' | 'Consent' | 'Lab missed';
  description: string;
  severity: 'Minor' | 'Major';
  reportedOn: string;
  status: 'Open' | 'CAPA in progress' | 'Closed';
}

export interface Visit {
  id: string;
  participantId: string;
  studyId: string;
  visitName: string;
  scheduled: string;
  actual?: string;
  sbp?: number;
  dbp?: number;
  weight?: number;
  alt?: number;
  creatinine?: number;
  status: 'Scheduled' | 'Done' | 'Missed';
}

export interface AuditEntry {
  seq: number;
  ts: string;
  actor: string;
  role: RoleId | 'system';
  action: string;
  entity: string;
  entityId: string;
  detail: string;
  reason?: string;
  prevHash: string;
  hash: string;
}

export interface ESignature {
  id: string;
  signer: string;
  role: RoleId;
  meaning: 'Authored' | 'Reviewed' | 'Approved' | 'Responsible for content';
  entity: string;
  entityId: string;
  ts: string;
  auditSeq: number;
}

export interface AiDecision {
  key: string;
  decision: 'accepted' | 'dismissed';
  by: string;
  ts: string;
}
