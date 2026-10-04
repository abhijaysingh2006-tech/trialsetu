// Synthetic trial generator. Deterministic (seeded PRNG) and anchored to `now`, so
// statutory clocks are always "live" in a demo: 2 SAEs near the 24h deadline, 1 overdue.
// ALL DATA IS SYNTHETIC. Names, CTRI numbers and codes are illustrative only.

import type {
  AdverseEvent, Batch, Deviation, Formulation, Participant, Site, Study, StudySite, User, Visit,
} from '../types';

const DAY = 86_400_000;
const HOUR = 3_600_000;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SeedData {
  anchor: string;
  users: User[];
  sites: Site[];
  formulations: Formulation[];
  batches: Batch[];
  studies: Study[];
  participants: Participant[];
  aes: AdverseEvent[];
  deviations: Deviation[];
  visits: Visit[];
}

export const SITES: Site[] = [
  { id: 'S01', name: 'AIIA Sarita Vihar (Hospital Block)', city: 'New Delhi', state: 'Delhi' },
  { id: 'S02', name: 'AIIA Goa Campus', city: 'Dhargal', state: 'Goa' },
  { id: 'S03', name: 'Partner Ayurveda Hospital – Jaipur', city: 'Jaipur', state: 'Rajasthan' },
  { id: 'S04', name: 'Partner Ayurveda Hospital – Jamnagar', city: 'Jamnagar', state: 'Gujarat' },
  { id: 'S05', name: 'Partner Ayurveda Hospital – Varanasi', city: 'Varanasi', state: 'Uttar Pradesh' },
  { id: 'S06', name: 'Partner Ayurveda Hospital – Bhubaneswar', city: 'Bhubaneswar', state: 'Odisha' },
  { id: 'S07', name: 'Partner Ayurveda Hospital – Pune', city: 'Pune', state: 'Maharashtra' },
  { id: 'S08', name: 'Partner Ayurveda Hospital – Thiruvananthapuram', city: 'Thiruvananthapuram', state: 'Kerala' },
];

export const USERS: User[] = [
  { id: 'U-INV-01', name: 'Dr. Meera Iyer', role: 'investigator', title: 'Principal Investigator · AIIA New Delhi', siteId: 'S01', studyIds: ['T10', 'T11'] },
  { id: 'U-EC-01', name: 'Prof. R. K. Sharma', role: 'ethics', title: 'Member Secretary · Institutional Ethics Committee' },
  { id: 'U-PV-01', name: 'Dr. Anjali Verma', role: 'pv', title: 'Pharmacovigilance Officer · AIIA PV Cell / NPvCC' },
  { id: 'U-LD-01', name: 'Dr. S. Rao', role: 'leadership', title: 'Dean (Research) · Read-only regulator view' },
];

export const FORMULATIONS: Formulation[] = [
  { id: 'F-ASH', name: 'Ashwagandha Churna', nameHi: 'अश्वगंधा चूर्ण', dosageForm: 'Churna (powder), 3 g BD', ingredients: 'Withania somnifera (root)', reference: 'Ayurvedic Formulary of India, Pt I' },
  { id: 'F-GUD', name: 'Guduchi Ghanavati', nameHi: 'गुडूची घनवटी', dosageForm: 'Ghanavati (tablet), 500 mg BD', ingredients: 'Tinospora cordifolia (stem) aqueous extract', reference: 'Ayurvedic Pharmacopoeia of India' },
  { id: 'F-TRI', name: 'Triphala Churna', nameHi: 'त्रिफला चूर्ण', dosageForm: 'Churna (powder), 5 g HS', ingredients: 'Haritaki, Bibhitaki, Amalaki (equal parts)', reference: 'Sharangadhara Samhita' },
  { id: 'F-KSG', name: 'Kaishore Guggulu', nameHi: 'कैशोर गुग्गुलु', dosageForm: 'Vati (tablet), 500 mg TDS', ingredients: 'Guggulu, Guduchi, Triphala, Trikatu, Trivrit, Danti', reference: 'Bhaishajya Ratnavali, Vatarakta Chikitsa' },
];

export const BATCHES: Batch[] = [
  { id: 'B-ASH-2604', formulationId: 'F-ASH', batchNo: 'ASH/26/04', manufacturer: 'AIIA GMP Pharmacy (synthetic)', mfgDate: '2026-04-12', expiryDate: '2028-04-11', qcStatus: 'Released', heavyMetalsPass: true, microbialPass: true, unitsDispensed: 0 },
  { id: 'B-GUD-2603', formulationId: 'F-GUD', batchNo: 'GUD/26/03', manufacturer: 'AIIA GMP Pharmacy (synthetic)', mfgDate: '2026-03-02', expiryDate: '2028-03-01', qcStatus: 'Released', heavyMetalsPass: true, microbialPass: true, unitsDispensed: 0 },
  { id: 'B-TRI-2605', formulationId: 'F-TRI', batchNo: 'TRI/26/05', manufacturer: 'Licensed ASU Mfr. – Unit 7 (synthetic)', mfgDate: '2026-05-20', expiryDate: '2028-05-19', qcStatus: 'Released', heavyMetalsPass: true, microbialPass: true, unitsDispensed: 0 },
  { id: 'B-KSG-2602', formulationId: 'F-KSG', batchNo: 'KSG/26/02', manufacturer: 'AIIA GMP Pharmacy (synthetic)', mfgDate: '2026-02-08', expiryDate: '2028-02-07', qcStatus: 'Released', heavyMetalsPass: true, microbialPass: true, unitsDispensed: 0 },
  { id: 'B-KSG-2606', formulationId: 'F-KSG', batchNo: 'KSG/26/06', manufacturer: 'Licensed ASU Mfr. – Unit 3 (synthetic)', mfgDate: '2026-06-15', expiryDate: '2028-06-14', qcStatus: 'Released', heavyMetalsPass: true, microbialPass: true, unitsDispensed: 0 },
];

const PI_NAMES = ['Dr. Meera Iyer', 'Dr. Arvind Kulkarni', 'Dr. Farah Siddiqui', 'Dr. Prakash Nair', 'Dr. Kavita Joshi', 'Dr. Suresh Patnaik', 'Dr. Lakshmi Menon', 'Dr. Rohit Bansal'];

interface StudyDef {
  id: string; title: string; titleHi: string; ayur: string; cond: string; f: string;
  phase: Study['phase']; status: Study['status']; target: number; enrolled: number;
  sites: string[]; startM: number; endM: number; ecExpiryD: number; ecStatus: Study['ecRenewalStatus'];
  ctriUpdD: number; ctriChangeD?: number; design: string;
}

const STUDY_DEFS: StudyDef[] = [
  { id: 'T01', title: 'Ashwagandha Churna in Generalised Anxiety Disorder', titleHi: 'सामान्यीकृत चिंता विकार में अश्वगंधा चूर्ण', ayur: 'Chittodvega', cond: 'Generalised anxiety disorder', f: 'F-ASH', phase: 'Phase III', status: 'Recruiting', target: 120, enrolled: 72, sites: ['S01', 'S02', 'S03', 'S07'], startM: -14, endM: 8, ecExpiryD: 210, ecStatus: 'Approved', ctriUpdD: 60, design: 'Randomised, double-blind, placebo-controlled, parallel' },
  { id: 'T02', title: 'Ashwagandha Churna in Primary Insomnia', titleHi: 'प्राथमिक अनिद्रा में अश्वगंधा चूर्ण', ayur: 'Anidra', cond: 'Primary insomnia', f: 'F-ASH', phase: 'Phase II', status: 'Recruiting', target: 80, enrolled: 50, sites: ['S01', 'S05', 'S08'], startM: -10, endM: 6, ecExpiryD: 12, ecStatus: 'Renewal due', ctriUpdD: 95, design: 'Randomised, open-label, active-controlled' },
  { id: 'T03', title: 'Ashwagandha Rasayana in Age-related Sarcopenia', titleHi: 'वृद्धावस्था सार्कोपेनिया में अश्वगंधा रसायन', ayur: 'Jara (Rasayana)', cond: 'Sarcopenia', f: 'F-ASH', phase: 'Phase II/III', status: 'Active, not recruiting', target: 80, enrolled: 80, sites: ['S01', 'S02', 'S04', 'S06', 'S08'], startM: -18, endM: 3, ecExpiryD: 45, ecStatus: 'Approved', ctriUpdD: 40, ctriChangeD: 55, design: 'Randomised, double-blind, placebo-controlled' },
  { id: 'T04', title: 'Guduchi Ghanavati in Post-viral Fatigue', titleHi: 'वायरल-पश्चात थकान में गुडूची घनवटी', ayur: 'Jwara-pashchat Daurbalya', cond: 'Post-viral fatigue', f: 'F-GUD', phase: 'Phase II', status: 'Completed', target: 60, enrolled: 60, sites: ['S01', 'S03', 'S05'], startM: -24, endM: -2, ecExpiryD: 120, ecStatus: 'Approved', ctriUpdD: 30, ctriChangeD: 60, design: 'Randomised, placebo-controlled' },
  { id: 'T05', title: 'Guduchi Ghanavati in Prediabetes', titleHi: 'प्रीडायबिटीज़ में गुडूची घनवटी', ayur: 'Prameha Purvarupa', cond: 'Prediabetes', f: 'F-GUD', phase: 'Phase III', status: 'Recruiting', target: 100, enrolled: 41, sites: ['S01', 'S02', 'S04', 'S07'], startM: -9, endM: 9, ecExpiryD: 300, ecStatus: 'Approved', ctriUpdD: 20, design: 'Randomised, double-blind, placebo-controlled' },
  { id: 'T06', title: 'Guduchi as Add-on in Rheumatoid Arthritis', titleHi: 'संधिवात (आमवात) में गुडूची सहायक चिकित्सा', ayur: 'Amavata', cond: 'Rheumatoid arthritis', f: 'F-GUD', phase: 'Phase II', status: 'EC approval pending', target: 70, enrolled: 0, sites: ['S01', 'S06', 'S08'], startM: 1, endM: 18, ecExpiryD: 0, ecStatus: 'Pending initial', ctriUpdD: 10, design: 'Randomised, add-on to standard care' },
  { id: 'T07', title: 'Triphala Churna in Functional Constipation', titleHi: 'कार्यात्मक कब्ज (विबंध) में त्रिफला चूर्ण', ayur: 'Vibandha', cond: 'Functional constipation', f: 'F-TRI', phase: 'Phase III', status: 'Recruiting', target: 110, enrolled: 64, sites: ['S01', 'S02', 'S03', 'S04', 'S05', 'S07'], startM: -12, endM: 6, ecExpiryD: 25, ecStatus: 'Renewal submitted', ctriUpdD: 75, design: 'Randomised, double-blind, placebo-controlled' },
  { id: 'T08', title: 'Triphala Churna in Class-I Obesity', titleHi: 'स्थौल्य (मोटापा) में त्रिफला चूर्ण', ayur: 'Sthaulya', cond: 'Obesity class I', f: 'F-TRI', phase: 'Phase II', status: 'Recruiting', target: 80, enrolled: 18, sites: ['S02', 'S06', 'S07'], startM: -8, endM: 7, ecExpiryD: 150, ecStatus: 'Approved', ctriUpdD: 170, design: 'Randomised, open-label, lifestyle-controlled' },
  { id: 'T09', title: 'Triphala Gandusha in Chronic Periodontitis', titleHi: 'दीर्घकालिक पीरियडोंटाइटिस में त्रिफला गण्डूष', ayur: 'Upakusha', cond: 'Chronic periodontitis', f: 'F-TRI', phase: 'Phase IV', status: 'Suspended', target: 60, enrolled: 24, sites: ['S03', 'S05', 'S08'], startM: -11, endM: 4, ecExpiryD: 90, ecStatus: 'Approved', ctriUpdD: 100, ctriChangeD: 40, design: 'Randomised, active-controlled (chlorhexidine)' },
  { id: 'T10', title: 'Kaishore Guggulu in Knee Osteoarthritis', titleHi: 'घुटने के ऑस्टियोआर्थराइटिस (संधिगत वात) में कैशोर गुग्गुलु', ayur: 'Sandhigata Vata', cond: 'Knee osteoarthritis', f: 'F-KSG', phase: 'Phase III', status: 'Recruiting', target: 120, enrolled: 60, sites: ['S01', 'S02', 'S03', 'S04', 'S07'], startM: -11, endM: 7, ecExpiryD: 180, ecStatus: 'Approved', ctriUpdD: 45, design: 'Randomised, double-blind, active-controlled (glucosamine)' },
  { id: 'T11', title: 'Kaishore Guggulu in Gouty Arthritis', titleHi: 'वातरक्त (गठिया) में कैशोर गुग्गुलु', ayur: 'Vatarakta', cond: 'Gouty arthritis', f: 'F-KSG', phase: 'Phase II', status: 'Recruiting', target: 70, enrolled: 34, sites: ['S01', 'S05', 'S06'], startM: -7, endM: 8, ecExpiryD: 250, ecStatus: 'Approved', ctriUpdD: 30, design: 'Randomised, open-label, standard-care controlled' },
  { id: 'T12', title: 'Kaishore Guggulu as Add-on in Plaque Psoriasis', titleHi: 'एककुष्ठ (सोरायसिस) में कैशोर गुग्गुलु सहायक चिकित्सा', ayur: 'Ekakushtha', cond: 'Plaque psoriasis', f: 'F-KSG', phase: 'Phase II', status: 'Recruiting', target: 60, enrolled: 30, sites: ['S01', 'S02', 'S08'], startM: -9, endM: 6, ecExpiryD: 5, ecStatus: 'Renewal submitted', ctriUpdD: 15, design: 'Randomised, add-on to topical standard care' },
];

const iso = (ms: number) => new Date(ms).toISOString();
const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const monthKey = (ms: number) => new Date(ms).toISOString().slice(0, 7);

// AE term library: verbatim, NAMASTE-style Ayurveda term, MedDRA PT, SOC
type Term = [string, string | undefined, string, string];
const GENERIC_TERMS: Term[] = [
  ['Mild headache', 'Shirashoola', 'Headache', 'Nervous system disorders'],
  ['Loose stools', 'Atisara', 'Diarrhoea', 'Gastrointestinal disorders'],
  ['Bloating after doses', 'Adhmana', 'Abdominal distension', 'Gastrointestinal disorders'],
  ['Burning in chest / sour belching', 'Amlapitta', 'Dyspepsia', 'Gastrointestinal disorders'],
  ['Itching on forearms', 'Kandu', 'Pruritus', 'Skin and subcutaneous tissue disorders'],
  ['Skin rash', undefined, 'Rash', 'Skin and subcutaneous tissue disorders'],
  ['Daytime drowsiness', 'Tandra', 'Somnolence', 'Nervous system disorders'],
  ['Nausea', 'Hrillasa', 'Nausea', 'Gastrointestinal disorders'],
  ['Loss of appetite', 'Aruchi', 'Decreased appetite', 'Metabolism and nutrition disorders'],
  ['Tiredness', 'Klama', 'Fatigue', 'General disorders and administration site conditions'],
  ['Dizziness on standing', 'Bhrama', 'Dizziness', 'Nervous system disorders'],
];
const HEPATIC_TERMS: Term[] = [
  ['Raised liver enzymes on W4 labs', undefined, 'Hepatic enzyme increased', 'Investigations'],
  ['Yellowish discolouration of eyes', 'Kamala', 'Jaundice', 'Hepatobiliary disorders'],
  ['Upper abdominal pain', 'Udarashoola', 'Abdominal pain upper', 'Gastrointestinal disorders'],
  ['Dark coloured urine', 'Pitta-mutrata', 'Chromaturia', 'Renal and urinary disorders'],
  ['Nausea with poor appetite', 'Hrillasa', 'Nausea', 'Gastrointestinal disorders'],
];

export function generateSeed(nowMs: number = Date.now(), seed = 26046): SeedData {
  const rnd = mulberry32(seed);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
  const normal = (mu: number, sd: number) => {
    const u = Math.max(rnd(), 1e-9), v = rnd();
    return mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const batches: Batch[] = BATCHES.map((b) => ({ ...b }));
  const batchFor = (fid: string, enrolledMs: number): string => {
    if (fid === 'F-KSG') return enrolledMs < nowMs - 105 * DAY ? 'B-KSG-2602' : 'B-KSG-2606';
    return batches.find((b) => b.formulationId === fid)!.id;
  };

  const studies: Study[] = [];
  const participants: Participant[] = [];
  const visits: Visit[] = [];

  STUDY_DEFS.forEach((d, si) => {
    const startMs = nowMs + d.startM * 30 * DAY;
    const endMs = nowMs + d.endM * 30 * DAY;
    const perSite = Math.floor(d.target / d.sites.length);
    const sites: StudySite[] = d.sites.map((sid, k) => ({
      siteId: sid,
      piName: k === 0 && (d.id === 'T10' || d.id === 'T11') ? 'Dr. Meera Iyer' : PI_NAMES[(si + k) % PI_NAMES.length],
      target: k === 0 ? d.target - perSite * (d.sites.length - 1) : perSite,
      activatedOn: isoDate(startMs + k * 20 * DAY),
    }));

    // Enrolment window: start -> min(now, end) with a slow ramp (sqrt) for realism.
    const enrolEnd = d.status === 'Completed' ? endMs - 150 * DAY : d.status === 'Active, not recruiting' ? nowMs - 60 * DAY : nowMs - 2 * DAY;
    const sp: Participant[] = [];
    for (let i = 0; i < d.enrolled; i++) {
      const frac = Math.pow(rnd(), 0.8);
      const enrolledMs = startMs + 25 * DAY + frac * (enrolEnd - startMs - 25 * DAY);
      const site = sites[Math.floor(rnd() * sites.length)];
      const arm: Participant['arm'] = rnd() < 0.5 ? 'Intervention' : 'Control';
      const n = String(i + 1).padStart(3, '0');
      const consentRoll = rnd();
      sp.push({
        id: `${d.id}-${site.siteId}-${n}`,
        vaultToken: 'vlt_' + Math.floor(rnd() * 0xffffffff).toString(16).padStart(8, '0'),
        studyId: d.id,
        siteId: site.siteId,
        arm,
        sex: rnd() < 0.52 ? 'F' : 'M',
        age: d.id === 'T03' ? int(62, 80) : int(22, 68),
        enrolledOn: isoDate(enrolledMs),
        status: d.status === 'Completed' ? 'Completed' : rnd() < 0.05 ? 'Withdrawn' : 'Enrolled',
        batchId: arm === 'Intervention' ? batchFor(d.f, enrolledMs) : null,
        consentVersion: rnd() < 0.85 ? 'v2.1' : 'v2.0',
        consentStatus: consentRoll < 0.03 ? 'Withdrawn' : consentRoll < 0.08 ? 'Re-consent required' : 'Granted',
        consentPurposes: { trial: true, pvSharing: rnd() < 0.93, futureResearch: rnd() < 0.6 },
        consentLanguage: rnd() < 0.6 ? 'Hindi' : 'English',
        consentedAt: iso(enrolledMs - int(1, 6) * DAY),
      });
    }
    sp.sort((a, b) => a.enrolledOn.localeCompare(b.enrolledOn));
    participants.push(...sp);

    // Monthly cumulative enrolment history
    const hist: { month: string; cumulative: number }[] = [];
    if (startMs < nowMs) {
      let m = new Date(startMs); m = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), 1));
      const stop = Math.min(nowMs, endMs + 30 * DAY);
      while (m.getTime() <= stop) {
        const key = monthKey(m.getTime());
        hist.push({ month: key, cumulative: sp.filter((p) => p.enrolledOn.slice(0, 7) <= key).length });
        m = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1));
      }
    }

    const ecExpiry = nowMs + d.ecExpiryD * DAY;
    studies.push({
      id: d.id,
      code: `AIIA-${d.f.slice(2)}-${d.id}`,
      title: d.title,
      titleHi: d.titleHi,
      ayurvedaCondition: d.ayur,
      condition: d.cond,
      formulationId: d.f,
      phase: d.phase,
      status: d.status,
      ctriNo: `CTRI/20${25 + (d.startM < -12 ? 0 : 1)}/${String(((si * 5) % 12) + 1).padStart(2, '0')}/09${String(1100 + si * 37).padStart(4, '0')}`,
      ctriLastUpdated: isoDate(nowMs - d.ctriUpdD * DAY),
      ctriStatusChangedOn: d.ctriChangeD ? isoDate(nowMs - d.ctriChangeD * DAY) : undefined,
      sponsor: 'All India Institute of Ayurveda (synthetic)',
      piName: sites[0].piName,
      sites,
      target: d.target,
      startDate: isoDate(startMs),
      plannedEndDate: isoDate(endMs),
      ecName: d.sites[0] === 'S02' ? 'IEC, AIIA Goa (synthetic)' : 'IEC, AIIA New Delhi (synthetic)',
      ecApprovalDate: d.ecStatus === 'Pending initial' ? '' : isoDate(ecExpiry - 365 * DAY),
      ecExpiryDate: d.ecStatus === 'Pending initial' ? '' : isoDate(ecExpiry),
      ecRenewalStatus: d.ecStatus,
      design: d.design,
      enrolmentHistory: hist,
    });

    // Visits: Baseline, Week 4, Week 12 with labs/vitals and injected anomalies
    sp.forEach((p, pi) => {
      const e0 = Date.parse(p.enrolledOn);
      const baseW = normal(d.id === 'T08' ? 86 : 64, 9);
      const hepatic = p.batchId === 'B-KSG-2606' && rnd() < 0.45;
      ([['Baseline', 0], ['Week 4', 28], ['Week 12', 84]] as const).forEach(([vn, off], vi) => {
        const sched = e0 + off * DAY;
        const done = sched < nowMs - DAY;
        let jitter = vi === 0 ? 0 : int(-2, 2);
        if (vi > 0 && rnd() < 0.03) jitter = int(6, 11); // out-of-window visit
        let sbp = Math.round(normal(128, 12));
        if (p.siteId === 'S05') sbp = Math.round(sbp / 10) * 10; // digit preference at one site
        let weight = Math.round((baseW + normal(0, 0.8) - vi * 0.4) * 10) / 10;
        if (d.id === 'T08' && pi === 3 && vi === 2) weight = Math.round(weight * 2.2 * 10) / 10; // lbs entered as kg
        if (d.id === 'T01' && pi === 11 && vi === 1) weight = Math.round(weight * 2.2 * 10) / 10;
        let alt = Math.round(Math.max(8, normal(26, 7)));
        if (hepatic && vi >= 1) alt = int(110, 265);
        visits.push({
          id: `V-${p.id}-${vi}`,
          participantId: p.id,
          studyId: d.id,
          visitName: vn,
          scheduled: isoDate(sched),
          actual: done ? isoDate(sched + jitter * DAY) : undefined,
          sbp: done ? sbp : undefined,
          dbp: done ? Math.round(sbp * 0.63 + normal(0, 4)) : undefined,
          weight: done ? weight : undefined,
          alt: done ? alt : undefined,
          creatinine: done ? Math.round(normal(0.9, 0.15) * 100) / 100 : undefined,
          status: done ? (rnd() < 0.02 ? 'Missed' : 'Done') : 'Scheduled',
        });
      });
    });
  });

  // Units dispensed per batch (exposure denominator)
  batches.forEach((b) => { b.unitsDispensed = participants.filter((p) => p.batchId === b.id).length; });

  // ---------------- Adverse events ----------------
  const aes: AdverseEvent[] = [];
  let aeN = 0;
  const intervention = participants.filter((p) => p.batchId);
  const mkAE = (p: Participant, t: Term, opts: Partial<AdverseEvent> = {}): AdverseEvent => {
    aeN++;
    const onset = opts.onsetAt ? Date.parse(opts.onsetAt) : Math.max(Date.parse(p.enrolledOn) + int(3, 40) * DAY, nowMs - int(3, 150) * DAY);
    const onsetMs = Math.min(onset, nowMs - 2 * HOUR);
    const coded = rnd() < 0.78;
    return {
      id: `AE-${String(aeN).padStart(4, '0')}`,
      participantId: p.id,
      studyId: p.studyId,
      siteId: p.siteId,
      batchId: p.batchId,
      verbatim: t[0],
      namasteTerm: t[1],
      meddraPT: coded ? t[2] : undefined,
      meddraSOC: coded ? t[3] : undefined,
      codingStatus: coded ? 'Coded' : t[1] ? 'Suggested' : 'Uncoded',
      severity: rnd() < 0.6 ? 'Mild' : 'Moderate',
      serious: false,
      causality: pick(['Possible', 'Possible', 'Unlikely', 'Probable'] as const),
      outcome: rnd() < 0.7 ? 'Recovered' : 'Recovering',
      onsetAt: iso(onsetMs),
      awareAt: iso(onsetMs + int(1, 20) * HOUR),
      status: rnd() < 0.6 ? 'Closed' : 'Open',
      ...opts,
    };
  };

  // 6 SAEs (anchored to now so the 24h clock is live)
  const pBy = (study: string, batch?: string, idx = 0) =>
    intervention.filter((p) => p.studyId === study && (!batch || p.batchId === batch))[idx] ?? intervention.find((p) => p.studyId === study)!;

  const saeSpecs: { p: Participant; t: Term; awareAgoH: number; reportedAfterH?: number; analysisAfterD?: number; ecAfterD?: number; crit: AdverseEvent['seriousCriteria']; caus: AdverseEvent['causality']; narrative: string; status: AdverseEvent['status']; coded: boolean }[] = [
    { p: pBy('T10', 'B-KSG-2606', 0), t: ['Jaundice with ALT 8x ULN — admitted for evaluation', 'Kamala (Pittaja)', 'Drug-induced liver injury', 'Hepatobiliary disorders'], awareAgoH: 22.5, crit: ['Hospitalisation'], caus: 'Probable', narrative: 'Participant on Kaishore Guggulu (batch KSG/26/06) for 6 weeks presented with icterus, anorexia and dark urine. ALT 318 U/L, bilirubin 4.1 mg/dL. IP withheld; admitted. Viral markers pending.', status: 'Open', coded: false },
    { p: pBy('T05', undefined, 2), t: ['Hypoglycaemic episode requiring admission', 'Glani with Sweda', 'Hypoglycaemia', 'Metabolism and nutrition disorders'], awareAgoH: 20, crit: ['Hospitalisation'], caus: 'Possible', narrative: 'Participant on Guduchi Ghanavati with concomitant metformin started by external GP. Capillary glucose 48 mg/dL, admitted overnight; resolved with IV dextrose.', status: 'Open', coded: true },
    { p: pBy('T03', undefined, 4), t: ['Fall at home with hip fracture', undefined, 'Hip fracture', 'Injury, poisoning and procedural complications'], awareAgoH: 27, crit: ['Hospitalisation', 'Disability'], caus: 'Unlikely', narrative: 'Elderly participant slipped in bathroom; surgical fixation performed. Investigator considers unrelated to IP.', status: 'Open', coded: true },
    { p: pBy('T12', 'B-KSG-2606', 0), t: ['Liver enzymes >5x ULN, hospitalised', undefined, 'Hepatic enzyme increased', 'Investigations'], awareAgoH: 6 * 24, reportedAfterH: 18, crit: ['Hospitalisation'], caus: 'Possible', narrative: 'Asymptomatic ALT rise to 226 U/L at Week 4 on Kaishore Guggulu (batch KSG/26/06). Admitted for monitoring; trending down after dechallenge.', status: 'Initial reported', coded: true },
    { p: pBy('T07', undefined, 1), t: ['Acute appendicitis — appendicectomy', undefined, 'Appendicitis', 'Infections and infestations'], awareAgoH: 40 * 24, reportedAfterH: 9, analysisAfterD: 11, ecAfterD: 24, crit: ['Hospitalisation'], caus: 'Unlikely', narrative: 'Uncomplicated laparoscopic appendicectomy. Recovered. Unrelated to IP per investigator and sponsor.', status: 'Closed', coded: true },
    { p: pBy('T01', undefined, 3), t: ['Lip and eyelid swelling after dose', 'Shotha (Sheetapitta)', 'Angioedema', 'Skin and subcutaneous tissue disorders'], awareAgoH: 4 * 24, reportedAfterH: 14, crit: ['Other medically important'], caus: 'Probable', narrative: 'Angioedema within 2 h of dose; treated with antihistamine and steroid in casualty, observed 10 h. IP permanently discontinued.', status: 'Under analysis', coded: true },
  ];
  saeSpecs.forEach((s) => {
    const aware = nowMs - s.awareAgoH * HOUR;
    aes.push(mkAE(s.p, s.t, {
      serious: true,
      severity: 'Severe',
      seriousCriteria: s.crit,
      causality: s.caus,
      narrative: s.narrative,
      onsetAt: iso(aware - 3 * HOUR),
      awareAt: iso(aware),
      reportedAt: s.reportedAfterH ? iso(aware + s.reportedAfterH * HOUR) : undefined,
      analysisReportedAt: s.analysisAfterD ? iso(aware + s.analysisAfterD * DAY) : undefined,
      ecOpinionAt: s.ecAfterD ? iso(aware + s.ecAfterD * DAY) : undefined,
      status: s.status,
      outcome: s.status === 'Closed' ? 'Recovered' : 'Not recovered',
      meddraPT: s.coded ? s.t[2] : undefined,
      meddraSOC: s.coded ? s.t[3] : undefined,
      codingStatus: s.coded ? 'Coded' : 'Suggested',
    }));
  });

  // Batch KSG/26/06 cluster (hepatic/GI signal): 13 non-serious AEs
  const ksgB = intervention.filter((p) => p.batchId === 'B-KSG-2606');
  for (let i = 0; i < 13; i++) {
    const p = ksgB[(i * 3 + 1) % ksgB.length];
    aes.push(mkAE(p, HEPATIC_TERMS[i % HEPATIC_TERMS.length], { onsetAt: iso(nowMs - int(3, 70) * DAY), causality: rnd() < 0.6 ? 'Probable' : 'Possible' }));
  }
  // Background AEs spread across the other batches (incl. 3 on KSG/26/02)
  const otherPool = intervention.filter((p) => p.batchId !== 'B-KSG-2606');
  for (let i = 0; i < 41; i++) {
    const p = i < 3 ? otherPool.filter((x) => x.batchId === 'B-KSG-2602')[i * 4] : otherPool[Math.floor(rnd() * otherPool.length)];
    aes.push(mkAE(p, pick(GENERIC_TERMS)));
  }
  aes.sort((a, b) => b.awareAt.localeCompare(a.awareAt));

  // ---------------- Protocol deviations ----------------
  const devTemplates: [Deviation['category'], string, Deviation['severity']][] = [
    ['Visit window', 'Week 4 visit done outside ±3 day window', 'Minor'],
    ['Eligibility', 'HbA1c at screening outside inclusion range; enrolled in error', 'Major'],
    ['IP dosing', 'Participant took IP once daily instead of BD for 5 days (compliance diary)', 'Minor'],
    ['Consent', 'Re-consent on ICF v2.1 not obtained before Week 12 visit', 'Major'],
    ['Lab missed', 'Week 4 LFT sample not collected', 'Minor'],
    ['Visit window', 'Baseline vitals recorded after first IP dose', 'Minor'],
  ];
  const deviations: Deviation[] = [];
  for (let i = 0; i < 26; i++) {
    const p = participants[Math.floor(rnd() * participants.length)];
    const tpl = devTemplates[i % devTemplates.length];
    deviations.push({
      id: `PD-${String(i + 1).padStart(3, '0')}`,
      studyId: p.studyId, siteId: p.siteId, participantId: p.id,
      category: tpl[0], description: tpl[1], severity: tpl[2],
      reportedOn: isoDate(nowMs - int(1, 120) * DAY),
      status: pick(['Open', 'CAPA in progress', 'Closed', 'Closed'] as const),
    });
  }
  // Ensure the investigator's study has visible deviations
  ['T10', 'T10', 'T11'].forEach((sid, k) => {
    const p = participants.filter((x) => x.studyId === sid)[k + 2];
    deviations.push({ id: `PD-${String(27 + k).padStart(3, '0')}`, studyId: sid, siteId: p.siteId, participantId: p.id, category: devTemplates[k][0], description: devTemplates[k][1], severity: devTemplates[k][2], reportedOn: isoDate(nowMs - (k + 2) * DAY), status: 'Open' });
  });
  deviations.sort((a, b) => b.reportedOn.localeCompare(a.reportedOn));

  return {
    anchor: iso(nowMs),
    users: USERS,
    sites: SITES,
    formulations: FORMULATIONS,
    batches,
    studies,
    participants,
    aes,
    deviations,
    visits,
  };
}
