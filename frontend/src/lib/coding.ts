// Ayurveda-native terminology bridge: NAMASTE / ICD-11 TM2 -> MedDRA suggestions.
// Pluggable adapter interface. Only the MOCK adapter ships: MedDRA (MSSO) and WHODrug
// (UMC) are licensed dictionaries that AIIA loads under its own licence. Codes shown
// here for NAMASTE/TM2 are ILLUSTRATIVE placeholders, and MedDRA codes are omitted.

export interface CodingSuggestion {
  pt: string; // MedDRA Preferred Term
  soc: string; // System Organ Class
  confidence: number; // 0..1
  why: string; // explain-why line (human-readable)
  source: string; // adapter id
}

export interface ConceptMatch {
  namasteCode: string;
  term: string;
  devanagari: string;
  gloss: string;
  tm2Code: string;
  tm2Title: string;
  kind: 'Disorder' | 'Pattern (Dosha)' | 'Symptom (Lakshana)';
  matchType: 'exact' | 'synonym' | 'partial' | 'fuzzy';
  matchScore: number;
}

export interface CodingResult {
  concept?: ConceptMatch;
  suggestions: CodingSuggestion[];
}

export interface CodingAdapter {
  id: string;
  label: string;
  licensed: boolean;
  available: boolean;
  note: string;
  suggest(input: string): CodingResult;
}

type Row = {
  code: string; term: string; dev: string; gloss: string; tm2: string; tm2Title: string;
  kind: ConceptMatch['kind']; syn: string[];
  map: [pt: string, soc: string, conf: number, rationale: string][];
};

const SOC = {
  GI: 'Gastrointestinal disorders', SKIN: 'Skin and subcutaneous tissue disorders', NERV: 'Nervous system disorders',
  HEP: 'Hepatobiliary disorders', GEN: 'General disorders and administration site conditions', MET: 'Metabolism and nutrition disorders',
  PSY: 'Psychiatric disorders', MSK: 'Musculoskeletal and connective tissue disorders', INV: 'Investigations', REN: 'Renal and urinary disorders',
  IMM: 'Immune system disorders', VASC: 'Vascular disorders',
};

/** Small curated MOCK mapping table (≈20 concepts). Replace via a licensed adapter in production. */
export const MOCK_TABLE: Row[] = [
  { code: 'NAM-SYN-0142', term: 'Kamala', dev: 'कामला', gloss: 'Jaundice — yellow discolouration of eyes, skin, urine', tm2: 'TM2-SYN-B12', tm2Title: 'Jaundice disorder (TM2)', kind: 'Disorder', syn: ['kamla', 'kamala pittaja', 'pandu-kamala', 'haridra netra'],
    map: [['Jaundice', SOC.HEP, 0.93, "Classical lakshana 'haridra netra-tvak-mutra' ≡ icterus"], ['Hyperbilirubinaemia', SOC.INV, 0.71, 'Kamala presupposes raised bilirubin; use if only labs reported'], ['Drug-induced liver injury', SOC.HEP, 0.52, 'Consider when temporal association with IP and ALT >3x ULN'], ['Hepatitis', SOC.HEP, 0.41, 'Only if inflammatory aetiology confirmed']] },
  { code: 'NAM-SYN-0217', term: 'Amlapitta', dev: 'अम्लपित्त', gloss: 'Hyperacidity — sour belching, burning in chest/throat', tm2: 'TM2-SYN-C04', tm2Title: 'Hyperacidity disorder (TM2)', kind: 'Disorder', syn: ['amla pitta', 'hyperacidity', 'urodaha'],
    map: [['Dyspepsia', SOC.GI, 0.86, "Amlodgara (sour eructation) + hrit-kantha daha map to dyspepsia"], ['Gastrooesophageal reflux disease', SOC.GI, 0.78, 'Use when retrosternal burning predominates'], ['Hyperchlorhydria', SOC.GI, 0.49, 'Rarely documented objectively in ASU trials']] },
  { code: 'NAM-SYN-0031', term: 'Atisara', dev: 'अतिसार', gloss: 'Increased frequency of loose stools', tm2: 'TM2-SYN-C11', tm2Title: 'Diarrhoea disorder (TM2)', kind: 'Disorder', syn: ['atisaar', 'loose stools', 'drava mala'],
    map: [['Diarrhoea', SOC.GI, 0.95, 'Direct semantic equivalent'], ['Frequent bowel movements', SOC.GI, 0.55, 'If stool consistency is normal']] },
  { code: 'NAM-SYN-0388', term: 'Kandu', dev: 'कण्डू', gloss: 'Itching', tm2: 'TM2-SYN-L02', tm2Title: 'Itching (TM2 symptom)', kind: 'Symptom (Lakshana)', syn: ['kandoo', 'itching', 'khujli'],
    map: [['Pruritus', SOC.SKIN, 0.94, 'Direct semantic equivalent']] },
  { code: 'NAM-SYN-0391', term: 'Sheetapitta', dev: 'शीतपित्त', gloss: 'Wheals with itching and burning (urticarial)', tm2: 'TM2-SYN-L07', tm2Title: 'Urticarial disorder (TM2)', kind: 'Disorder', syn: ['shitapitta', 'udarda', 'sheetapitta'],
    map: [['Urticaria', SOC.SKIN, 0.89, "Varati-damshtavat shotha (wasp-sting-like wheals)"], ['Angioedema', SOC.SKIN, 0.57, 'If lip/eyelid swelling described'], ['Hypersensitivity', SOC.IMM, 0.44, 'Use only as umbrella when unspecified']] },
  { code: 'NAM-SYN-0402', term: 'Shotha', dev: 'शोथ', gloss: 'Swelling / oedema', tm2: 'TM2-SYN-G03', tm2Title: 'Swelling disorder (TM2)', kind: 'Disorder', syn: ['shoth', 'sotha', 'swelling'],
    map: [['Oedema', SOC.GEN, 0.8, 'Generalised swelling'], ['Swelling face', SOC.GEN, 0.62, 'If facial'], ['Angioedema', SOC.SKIN, 0.54, 'If acute, allergic context (see Sheetapitta)']] },
  { code: 'NAM-SYN-0011', term: 'Shirashoola', dev: 'शिरःशूल', gloss: 'Headache', tm2: 'TM2-SYN-N01', tm2Title: 'Headache (TM2 symptom)', kind: 'Symptom (Lakshana)', syn: ['shirahshool', 'shiroshoola', 'headache', 'sir dard'],
    map: [['Headache', SOC.NERV, 0.96, 'Direct semantic equivalent']] },
  { code: 'NAM-SYN-0019', term: 'Bhrama', dev: 'भ्रम', gloss: 'Giddiness / spinning sensation', tm2: 'TM2-SYN-N04', tm2Title: 'Giddiness (TM2 symptom)', kind: 'Symptom (Lakshana)', syn: ['bhram', 'giddiness', 'chakkar'],
    map: [['Dizziness', SOC.NERV, 0.88, 'Non-specific giddiness'], ['Vertigo', SOC.NERV, 0.6, 'Only if rotatory sensation documented']] },
  { code: 'NAM-SYN-0023', term: 'Tandra', dev: 'तन्द्रा', gloss: 'Drowsiness, stupor-like heaviness', tm2: 'TM2-SYN-N07', tm2Title: 'Drowsiness (TM2 symptom)', kind: 'Symptom (Lakshana)', syn: ['tandra', 'drowsiness'],
    map: [['Somnolence', SOC.NERV, 0.88, 'Daytime drowsiness'], ['Fatigue', SOC.GEN, 0.38, 'If heaviness without sleepiness']] },
  { code: 'NAM-SYN-0057', term: 'Aruchi', dev: 'अरुचि', gloss: 'Loss of taste/appetite', tm2: 'TM2-SYN-C02', tm2Title: 'Anorexia (TM2 symptom)', kind: 'Symptom (Lakshana)', syn: ['aruchi', 'anorexia', 'bhookh na lagna'],
    map: [['Decreased appetite', SOC.MET, 0.9, 'Preferred over Anorexia for non-eating-disorder context'], ['Dysgeusia', SOC.NERV, 0.41, "If 'loss of taste' (ruchi = taste) is meant"]] },
  { code: 'NAM-SYN-0061', term: 'Hrillasa', dev: 'हृल्लास', gloss: 'Nausea', tm2: 'TM2-SYN-C03', tm2Title: 'Nausea (TM2 symptom)', kind: 'Symptom (Lakshana)', syn: ['hrillas', 'utklesha', 'nausea', 'ji machalna'],
    map: [['Nausea', SOC.GI, 0.93, 'Direct semantic equivalent']] },
  { code: 'NAM-SYN-0066', term: 'Adhmana', dev: 'आध्मान', gloss: 'Abdominal distension with gurgling', tm2: 'TM2-SYN-C08', tm2Title: 'Abdominal distension (TM2 symptom)', kind: 'Symptom (Lakshana)', syn: ['adhman', 'bloating', 'aanaha'],
    map: [['Abdominal distension', SOC.GI, 0.91, 'Direct semantic equivalent'], ['Flatulence', SOC.GI, 0.58, 'If gas emphasised']] },
  { code: 'NAM-SYN-0071', term: 'Udarashoola', dev: 'उदरशूल', gloss: 'Abdominal pain', tm2: 'TM2-SYN-C09', tm2Title: 'Abdominal pain (TM2 symptom)', kind: 'Symptom (Lakshana)', syn: ['udar shool', 'abdominal pain', 'pet dard'],
    map: [['Abdominal pain', SOC.GI, 0.86, 'Unspecified location'], ['Abdominal pain upper', SOC.GI, 0.7, 'If epigastric / right hypochondrium']] },
  { code: 'NAM-SYN-0090', term: 'Klama', dev: 'क्लम', gloss: 'Tiredness without exertion', tm2: 'TM2-SYN-G01', tm2Title: 'Fatigue (TM2 symptom)', kind: 'Symptom (Lakshana)', syn: ['klam', 'shrama', 'fatigue', 'thakan'],
    map: [['Fatigue', SOC.GEN, 0.87, 'Anayasa shrama (fatigue without exertion)'], ['Asthenia', SOC.GEN, 0.64, 'If weakness emphasised']] },
  { code: 'NAM-SYN-0091', term: 'Glani', dev: 'ग्लानि', gloss: 'Malaise / exhaustion; with Sweda = sweating', tm2: 'TM2-SYN-G02', tm2Title: 'Malaise (TM2 symptom)', kind: 'Symptom (Lakshana)', syn: ['glani', 'glani with sweda', 'malaise'],
    map: [['Malaise', SOC.GEN, 0.74, 'Direct semantic equivalent'], ['Hypoglycaemia', SOC.MET, 0.58, "Glani + sweda + kampa in Prameha context ≈ hypoglycaemia; confirm glucose"], ['Hyperhidrosis', SOC.SKIN, 0.47, 'If sweating is the main complaint']] },
  { code: 'NAM-SYN-0120', term: 'Anidra', dev: 'अनिद्रा', gloss: 'Insomnia', tm2: 'TM2-SYN-P02', tm2Title: 'Sleeplessness disorder (TM2)', kind: 'Disorder', syn: ['anidra', 'nidranasha', 'insomnia'],
    map: [['Insomnia', SOC.PSY, 0.95, 'Direct semantic equivalent']] },
  { code: 'NAM-SYN-0125', term: 'Chittodvega', dev: 'चित्तोद्वेग', gloss: 'Anxious, agitated mind', tm2: 'TM2-SYN-P05', tm2Title: 'Anxiety disorder (TM2)', kind: 'Disorder', syn: ['chittodveg', 'anxiety'],
    map: [['Anxiety', SOC.PSY, 0.89, 'Udvega (agitation) of chitta'], ['Nervousness', SOC.PSY, 0.52, 'Mild, situational']] },
  { code: 'NAM-SYN-0160', term: 'Sandhishoola', dev: 'सन्धिशूल', gloss: 'Joint pain', tm2: 'TM2-SYN-M01', tm2Title: 'Joint pain (TM2 symptom)', kind: 'Symptom (Lakshana)', syn: ['sandhi shool', 'joint pain', 'jodon ka dard'],
    map: [['Arthralgia', SOC.MSK, 0.94, 'Direct semantic equivalent']] },
  { code: 'NAM-SYN-0171', term: 'Pitta-mutrata', dev: 'पीतमूत्रता', gloss: 'Dark yellow / reddish urine', tm2: 'TM2-SYN-R03', tm2Title: 'Discoloured urine (TM2 symptom)', kind: 'Symptom (Lakshana)', syn: ['peeta mutrata', 'dark urine', 'pita mutra'],
    map: [['Chromaturia', SOC.REN, 0.82, 'Urine discolouration'], ['Hyperbilirubinaemia', SOC.INV, 0.35, 'If with Kamala lakshana']] },
  { code: 'NAM-SYN-0901', term: 'Pitta Vriddhi Lakshana', dev: 'पित्त वृद्धि लक्षण', gloss: 'Aggravated Pitta pattern: burning, heat, yellow discolouration, thirst', tm2: 'TM2-SYN-PAT-P1', tm2Title: 'Heat (Pitta) aggravation pattern (TM2)', kind: 'Pattern (Dosha)', syn: ['pitta vriddhi', 'pitta prakopa', 'aggravated pitta'],
    map: [['Feeling hot', SOC.GEN, 0.55, "Pattern-level term: 'ushna' (heat) component"], ['Dyspepsia', SOC.GI, 0.44, "'Daha' (burning) in GI context"], ['Thirst', SOC.GEN, 0.41, "'Trishna' component"], ['Jaundice', SOC.HEP, 0.3, "'Peeta varna' only if icterus confirmed"]] },
  { code: 'NAM-SYN-0902', term: 'Vata Prakopa Lakshana', dev: 'वात प्रकोप लक्षण', gloss: 'Aggravated Vata pattern: pain, dryness, constipation, sleeplessness', tm2: 'TM2-SYN-PAT-V1', tm2Title: 'Wind (Vata) aggravation pattern (TM2)', kind: 'Pattern (Dosha)', syn: ['vata prakopa', 'vata vriddhi', 'aggravated vata'],
    map: [['Arthralgia', SOC.MSK, 0.5, "'Shoola' (pain) in joints"], ['Constipation', SOC.GI, 0.46, "'Vibandha' component"], ['Insomnia', SOC.PSY, 0.42, "'Anidra' component"], ['Dry skin', SOC.SKIN, 0.38, "'Raukshya' (dryness)"]] },
];

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[()\-_,.]/g, ' ').replace(/\s+/g, ' ').trim();

function lev(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

function matchRow(q: string, row: Row): { type: ConceptMatch['matchType']; score: number } | null {
  const t = norm(row.term);
  if (q === t || row.dev === q) return { type: 'exact', score: 1 };
  const syns = row.syn.map(norm);
  if (syns.includes(q)) return { type: 'synonym', score: 0.97 };
  const qTok = q.split(' ');
  if (qTok.some((w) => w.length > 3 && (w === t.split(' ')[0] || syns.some((s) => s.split(' ')[0] === w)))) return { type: 'partial', score: 0.9 };
  if (q.includes(t) || t.includes(q) && q.length > 3) return { type: 'partial', score: 0.85 };
  let best = 0;
  for (const cand of [t, ...syns]) for (const w of [q, ...qTok]) {
    if (w.length < 4) continue;
    const sim = 1 - lev(w, cand) / Math.max(w.length, cand.length);
    best = Math.max(best, sim);
  }
  return best >= 0.72 ? { type: 'fuzzy', score: Math.round(best * 0.9 * 100) / 100 } : null;
}

export const mockAdapter: CodingAdapter = {
  id: 'mock-namaste-meddra',
  label: 'Mock NAMASTE/TM2 → MedDRA table (demo)',
  licensed: false,
  available: true,
  note: '≈20 curated illustrative concepts. Ships with the prototype for demonstration only.',
  suggest(input: string): CodingResult {
    const q = norm(input);
    if (!q) return { suggestions: [] };
    let best: { row: Row; m: { type: ConceptMatch['matchType']; score: number } } | null = null;
    for (const row of MOCK_TABLE) {
      const m = matchRow(q, row);
      if (m && (!best || m.score > best.m.score)) best = { row, m };
    }
    if (!best) {
      // Fallback: direct English PT lookup
      const direct = MOCK_TABLE.flatMap((r) => r.map).filter(([pt]) => norm(pt).includes(q) || q.includes(norm(pt)));
      const seen = new Set<string>();
      return {
        suggestions: direct.filter(([pt]) => !seen.has(pt) && seen.add(pt)).slice(0, 4).map(([pt, soc, c]) => ({
          pt, soc, confidence: Math.round(c * 0.8 * 100) / 100, source: this.id,
          why: `No NAMASTE concept matched; English text matched MedDRA PT '${pt}' directly (confidence discounted 20%).`,
        })),
      };
    }
    const { row, m } = best;
    const concept: ConceptMatch = {
      namasteCode: row.code, term: row.term, devanagari: row.dev, gloss: row.gloss, tm2Code: row.tm2, tm2Title: row.tm2Title,
      kind: row.kind, matchType: m.type, matchScore: m.score,
    };
    const patternPenalty = row.kind === 'Pattern (Dosha)' ? ' Dosha patterns are multi-symptom constructs — pick the component actually observed.' : '';
    return {
      concept,
      suggestions: row.map.map(([pt, soc, conf, rationale]) => ({
        pt, soc, source: this.id,
        confidence: Math.round(conf * m.score * 100) / 100,
        why: `${m.type === 'exact' ? 'Exact' : m.type === 'synonym' ? 'Synonym' : m.type === 'partial' ? 'Partial' : 'Fuzzy'} match to NAMASTE '${row.term}' (${row.dev}) → ${row.tm2Title}. ${rationale}.${patternPenalty}`,
      })),
    };
  },
};

export const licensedMeddraAdapter: CodingAdapter = {
  id: 'meddra-licensed',
  label: 'MedDRA (MSSO) — licensed, loaded by AIIA',
  licensed: true,
  available: false,
  note: 'Drop MedDRA ASCII release files into /data/meddra on the server; the FastAPI adapter indexes LLT→PT→HLT→HLGT→SOC. Not bundled (licence).',
  suggest: () => ({ suggestions: [] }),
};

export const whoDrugAdapter: CodingAdapter = {
  id: 'whodrug-licensed',
  label: 'WHODrug Global (UMC) — licensed, for con-meds & herbal ATC',
  licensed: true,
  available: false,
  note: 'Used for concomitant medications and herbal ingredient coding. Not bundled (licence).',
  suggest: () => ({ suggestions: [] }),
};

export const ADAPTERS: CodingAdapter[] = [mockAdapter, licensedMeddraAdapter, whoDrugAdapter];
