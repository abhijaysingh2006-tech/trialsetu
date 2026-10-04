// Lightweight bilingual dictionary (English / हिन्दी). Missing keys fall back to English.
export type Lang = 'en' | 'hi';

const en = {
  appTagline: 'Auditable CTMS + Pharmacovigilance for Ayurveda/ASU trials',
  nav_dashboard: 'Dashboard', nav_studies: 'Study Registry', nav_safety: 'Safety & SAE Clocks', nav_batches: 'Batch Traceability',
  nav_coding: 'Terminology Bridge', nav_capture: 'Site Data Entry', nav_ai: 'AI Insights', nav_ethics: 'Ethics Approvals',
  nav_consent: 'Consent & Vault', nav_audit: 'Audit Trail', nav_interop: 'FHIR & Exports', nav_rules: 'Rule Engine',
  nav_scorecard: 'Compliance Scorecard', nav_about: 'Architecture',
  sec_operate: 'Operate', sec_safety: 'Safety', sec_govern: 'Govern', sec_system: 'System',
  role: 'Role', switchRole: 'Switch demo role', readOnly: 'Read-only view', online: 'Online', offline: 'Offline',
  synthetic: 'Synthetic data only · No real patient identifiers', hosting: 'India-region hosting (MeitY-empanelled cloud, Mumbai/Hyderabad)',
  kpi_studies: 'Active studies', kpi_enrolled: 'Participants enrolled', kpi_sites: 'Active sites', kpi_saes: 'Open SAEs',
  kpi_clocks: 'SAEs tracked on clock', kpi_audit: 'Unaudited changes', kpi_conformance: 'FHIR / SDTM conformance', kpi_access: 'Role-scoped access logged',
  portfolio: 'Portfolio', enrolment: 'Enrolment', target: 'Target', status: 'Status', phase: 'Phase', sites: 'Sites',
  viewStudy: 'View study', demoTour: 'Demo tour', next: 'Next', back: 'Back', close: 'Close',
  // capture form
  cap_title: 'Site data entry (CDASH)', cap_sub: 'Minimal-click forms that work offline and sync when connectivity returns.',
  cap_participant: 'Participant', cap_visit: 'Visit', cap_date: 'Visit date', cap_sbp: 'Systolic BP (mmHg)', cap_dbp: 'Diastolic BP (mmHg)',
  cap_weight: 'Weight (kg)', cap_temp: 'Temperature (°C)', cap_pulse: 'Pulse (/min)', cap_save: 'Save record', cap_queue: 'Sync queue',
  cap_syncNow: 'Sync now', cap_simOffline: 'Simulate offline', cap_vitals: 'Vital signs (VS)', cap_ae: 'Adverse event (AE)',
  cap_aeTerm: 'What happened? (verbatim)', cap_aeSeverity: 'Severity', cap_serious: 'Serious?', cap_onset: 'Onset date',
  cap_saved: 'Saved', cap_queued: 'Saved offline — queued for sync', cap_mild: 'Mild', cap_moderate: 'Moderate', cap_severe: 'Severe',
  yes: 'Yes', no: 'No',
};

const hi: Partial<Record<keyof typeof en, string>> = {
  appTagline: 'आयुर्वेद/आयुष परीक्षणों के लिए लेखा-परीक्षण योग्य CTMS + फार्माकोविजिलेंस',
  nav_dashboard: 'डैशबोर्ड', nav_studies: 'अध्ययन रजिस्ट्री', nav_safety: 'सुरक्षा व SAE घड़ियाँ', nav_batches: 'बैच अनुरेखण',
  nav_coding: 'शब्दावली सेतु', nav_capture: 'साइट डेटा प्रविष्टि', nav_ai: 'एआई अंतर्दृष्टि', nav_ethics: 'आचार अनुमोदन',
  nav_consent: 'सहमति व वॉल्ट', nav_audit: 'ऑडिट ट्रेल', nav_interop: 'FHIR व निर्यात', nav_rules: 'नियम इंजन',
  nav_scorecard: 'अनुपालन स्कोरकार्ड', nav_about: 'संरचना',
  sec_operate: 'संचालन', sec_safety: 'सुरक्षा', sec_govern: 'शासन', sec_system: 'प्रणाली',
  role: 'भूमिका', switchRole: 'डेमो भूमिका बदलें', readOnly: 'केवल-पठन दृश्य', online: 'ऑनलाइन', offline: 'ऑफ़लाइन',
  synthetic: 'केवल कृत्रिम डेटा · कोई वास्तविक रोगी पहचान नहीं', hosting: 'भारत-क्षेत्र होस्टिंग (MeitY-सूचीबद्ध क्लाउड)',
  kpi_studies: 'सक्रिय अध्ययन', kpi_enrolled: 'नामांकित प्रतिभागी', kpi_sites: 'सक्रिय साइटें', kpi_saes: 'खुले SAE',
  kpi_clocks: 'घड़ी पर ट्रैक SAE', kpi_audit: 'बिना ऑडिट परिवर्तन', kpi_conformance: 'FHIR / SDTM अनुरूपता', kpi_access: 'भूमिका-आधारित पहुँच लॉग',
  portfolio: 'पोर्टफोलियो', enrolment: 'नामांकन', target: 'लक्ष्य', status: 'स्थिति', phase: 'चरण', sites: 'साइटें',
  viewStudy: 'अध्ययन देखें', demoTour: 'डेमो यात्रा', next: 'आगे', back: 'पीछे', close: 'बंद करें',
  cap_title: 'साइट डेटा प्रविष्टि (CDASH)', cap_sub: 'कम-क्लिक फ़ॉर्म जो ऑफ़लाइन काम करते हैं और नेटवर्क लौटने पर सिंक होते हैं।',
  cap_participant: 'प्रतिभागी', cap_visit: 'विज़िट', cap_date: 'विज़िट तिथि', cap_sbp: 'सिस्टोलिक रक्तचाप (mmHg)', cap_dbp: 'डायस्टोलिक रक्तचाप (mmHg)',
  cap_weight: 'वज़न (कि.ग्रा.)', cap_temp: 'तापमान (°C)', cap_pulse: 'नाड़ी (/मिनट)', cap_save: 'रिकॉर्ड सहेजें', cap_queue: 'सिंक कतार',
  cap_syncNow: 'अभी सिंक करें', cap_simOffline: 'ऑफ़लाइन अनुकरण', cap_vitals: 'जीवन संकेत (VS)', cap_ae: 'प्रतिकूल घटना (AE)',
  cap_aeTerm: 'क्या हुआ? (रोगी के शब्दों में)', cap_aeSeverity: 'गंभीरता', cap_serious: 'गंभीर (Serious)?', cap_onset: 'आरंभ तिथि',
  cap_saved: 'सहेजा गया', cap_queued: 'ऑफ़लाइन सहेजा गया — सिंक हेतु कतार में', cap_mild: 'हल्का', cap_moderate: 'मध्यम', cap_severe: 'गंभीर',
  yes: 'हाँ', no: 'नहीं',
};

export type TKey = keyof typeof en;
export const dict = { en, hi };

export function translate(lang: Lang, key: TKey): string {
  return (lang === 'hi' ? hi[key] : undefined) ?? en[key];
}
