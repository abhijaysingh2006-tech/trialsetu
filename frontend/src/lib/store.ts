'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { makeEntry, type AuditInput } from './audit';
import { dataSource } from './api/dataSource';
import type { SeedData } from './seed/generate';
import { DEFAULT_RULES, type ClockRule } from './rules';
import type { Lang } from './i18n';
import type { AdverseEvent, AiDecision, AuditEntry, Batch, Deviation, ESignature, RoleId, Study, User, Visit } from './types';

export interface QueuedRecord {
  id: string;
  kind: 'VS' | 'AE';
  participantId: string;
  payload: Record<string, string | number | boolean>;
  createdAt: string;
  createdOffline: boolean;
}

interface State extends SeedData {
  ready: boolean;
  role: RoleId;
  lang: Lang;
  authed: boolean;
  audit: AuditEntry[];
  signatures: ESignature[];
  aiDecisions: Record<string, AiDecision>;
  rules: ClockRule[];
  syncQueue: QueuedRecord[];
  simulateOffline: boolean;
  tamperBackup: AuditEntry | null;
  tourStep: number | null;

  init(): Promise<void>;
  resetDemo(): Promise<void>;
  me(): User;
  log(input: Omit<AuditInput, 'actor' | 'role'> & { actor?: string; role?: RoleId | 'system' }): AuditEntry;
  login(role: RoleId): void;
  logout(): void;
  setRole(role: RoleId): void;
  setLang(lang: Lang): void;
  addAE(ae: Omit<AdverseEvent, 'id'>): AdverseEvent;
  reportSAE(aeId: string, which: '24h' | '14d' | 'ec'): void;
  codeAE(aeId: string, pt: string, soc: string, decision: 'accepted' | 'edited', confidence?: number): void;
  rejectCoding(aeId: string, pt: string): void;
  setBatchStatus(batchId: string, status: Batch['qcStatus'], reason: string): void;
  updateRule(rule: ClockRule, reason: string): void;
  resetRules(): void;
  addDeviation(d: Omit<Deviation, 'id'>): void;
  ecDecide(studyId: string, action: 'approve-renewal' | 'request-changes' | 'record-opinion', aeId?: string): void;
  markCtriUpdated(studyId: string): void;
  sign(entity: string, entityId: string, meaning: ESignature['meaning'], reason?: string): ESignature;
  decideAI(key: string, decision: 'accepted' | 'dismissed', detail: string): void;
  enqueue(rec: Omit<QueuedRecord, 'id' | 'createdAt' | 'createdOffline'>, offline: boolean): void;
  syncNow(): number;
  setSimulateOffline(b: boolean): void;
  tamper(): void;
  restoreTamper(): void;
  setTour(step: number | null): void;
}

const empty: SeedData = { anchor: '', users: [], sites: [], formulations: [], batches: [], studies: [], participants: [], aes: [], deviations: [], visits: [] };

/** Build a believable historical audit trail for the seeded records, then hash-chain it. */
function seedAudit(seed: SeedData): AuditEntry[] {
  const now = Date.parse(seed.anchor);
  const u = (r: RoleId) => seed.users.find((x) => x.role === r)!;
  const events: (AuditInput & { ts: string })[] = [];
  events.push({ ts: new Date(now - 800 * 86400000).toISOString(), actor: 'system', role: 'system', action: 'CHAIN_GENESIS', entity: 'audit', entityId: 'genesis', detail: 'Append-only audit chain initialised (SHA-256, prevHash-linked)' });
  seed.studies.forEach((s) => {
    const t0 = Date.parse(s.startDate) - 75 * 86400000;
    events.push({ ts: new Date(t0).toISOString(), actor: s.piName, role: 'investigator', action: 'CREATE', entity: 'study', entityId: s.id, detail: `Protocol ${s.code} registered: ${s.title}` });
    if (s.ecApprovalDate) events.push({ ts: new Date(Date.parse(s.ecApprovalDate)).toISOString(), actor: u('ethics').name, role: 'ethics', action: 'APPROVE', entity: 'ethics', entityId: s.id, detail: `EC approval recorded; valid until ${s.ecExpiryDate}`, reason: 'Full board review' });
    events.push({ ts: new Date(Date.parse(s.ctriLastUpdated)).toISOString(), actor: s.piName, role: 'investigator', action: 'UPDATE', entity: 'ctri', entityId: s.id, detail: `CTRI record ${s.ctriNo} updated` });
  });
  seed.aes.forEach((ae) => {
    const aware = Date.parse(ae.awareAt);
    events.push({ ts: new Date(Math.min(now - 60000, aware + 3600000)).toISOString(), actor: u('investigator').name, role: 'investigator', action: 'CREATE', entity: 'ae', entityId: ae.id, detail: `${ae.serious ? 'SAE' : 'AE'} entered: "${ae.verbatim}" (${ae.participantId}, batch ${ae.batchId ?? '—'})` });
    if (ae.codingStatus === 'Coded') events.push({ ts: new Date(Math.min(now - 30000, aware + 30 * 3600000)).toISOString(), actor: u('pv').name, role: 'pv', action: 'CODE', entity: 'ae', entityId: ae.id, detail: `Coded to MedDRA PT "${ae.meddraPT}"`, reason: 'Human-verified coding' });
    if (ae.reportedAt) events.push({ ts: ae.reportedAt, actor: u('pv').name, role: 'pv', action: 'SAE_REPORT_24H', entity: 'ae', entityId: ae.id, detail: 'Initial SAE report submitted to CLA, Sponsor & EC (SUGAM ref. synthetic)' });
    if (ae.analysisReportedAt) events.push({ ts: ae.analysisReportedAt, actor: u('pv').name, role: 'pv', action: 'SAE_REPORT_14D', entity: 'ae', entityId: ae.id, detail: 'SAE analysis report submitted' });
    if (ae.ecOpinionAt) events.push({ ts: ae.ecOpinionAt, actor: u('ethics').name, role: 'ethics', action: 'EC_OPINION', entity: 'ae', entityId: ae.id, detail: 'EC opinion on SAE recorded (not related; no compensation due)' });
  });
  events.sort((a, b) => a.ts.localeCompare(b.ts));
  const log: AuditEntry[] = [];
  events.forEach((e) => log.push(makeEntry(log[log.length - 1], e)));
  return log;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...empty,
      ready: false,
      role: 'leadership',
      lang: 'en',
      authed: false,
      audit: [],
      signatures: [],
      aiDecisions: {},
      rules: DEFAULT_RULES,
      syncQueue: [],
      simulateOffline: false,
      tamperBackup: null,
      tourStep: null,

      async init() {
        if (get().studies.length) { set({ ready: true }); return; }
        const seed = await dataSource.loadSeed(Date.now());
        set({ ...seed, audit: seedAudit(seed), signatures: [], aiDecisions: {}, rules: DEFAULT_RULES, syncQueue: [], ready: true });
      },
      async resetDemo() {
        const seed = await dataSource.loadSeed(Date.now());
        set({ ...seed, audit: seedAudit(seed), signatures: [], aiDecisions: {}, rules: DEFAULT_RULES, syncQueue: [], tamperBackup: null, ready: true });
        get().log({ action: 'DEMO_RESET', entity: 'system', entityId: 'seed', detail: 'Synthetic dataset regenerated (anchored to current time)' });
      },
      me() {
        const s = get();
        return s.users.find((u) => u.role === s.role) ?? { id: 'U-?', name: 'Unknown', role: s.role, title: '' };
      },
      log(input) {
        const s = get();
        const me = s.me();
        const entry = makeEntry(s.audit[s.audit.length - 1], { actor: input.actor ?? me.name, role: input.role ?? s.role, ...input });
        set({ audit: [...s.audit, entry] });
        dataSource.pushAudit(entry);
        return entry;
      },
      login(role) {
        set({ role, authed: true });
        get().log({ action: 'LOGIN', entity: 'session', entityId: role, detail: 'OIDC login (Keycloak mock) · MFA TOTP verified · role claim: ' + role });
      },
      logout() {
        get().log({ action: 'LOGOUT', entity: 'session', entityId: get().role, detail: 'Session ended' });
        set({ authed: false });
      },
      setRole(role) {
        const prev = get().role;
        if (prev === role) return;
        set({ role });
        get().log({ action: 'ROLE_SWITCH', entity: 'session', entityId: role, detail: `Demo role switch ${prev} → ${role} (re-authenticated, new token scope)` });
      },
      setLang(lang) { set({ lang }); },

      addAE(input) {
        const s = get();
        const n = s.aes.reduce((m, a) => Math.max(m, parseInt(a.id.slice(3), 10)), 0) + 1;
        const ae: AdverseEvent = { ...input, id: `AE-${String(n).padStart(4, '0')}` };
        set({ aes: [ae, ...s.aes] });
        get().log({ action: 'CREATE', entity: 'ae', entityId: ae.id, detail: `${ae.serious ? 'SAE' : 'AE'} entered: "${ae.verbatim}" (${ae.participantId}, batch ${ae.batchId ?? '—'})${ae.serious ? ' · 24h statutory clock started' : ''}` });
        dataSource.pushAE(ae);
        return ae;
      },
      reportSAE(aeId, which) {
        const now = new Date().toISOString();
        set({
          aes: get().aes.map((a) => a.id !== aeId ? a : which === '24h'
            ? { ...a, reportedAt: now, status: 'Initial reported' }
            : which === '14d' ? { ...a, analysisReportedAt: now, status: 'Under analysis' } : { ...a, ecOpinionAt: now, status: 'Closed' }),
        });
        const label = which === '24h' ? 'SAE_REPORT_24H' : which === '14d' ? 'SAE_REPORT_14D' : 'EC_OPINION';
        get().log({ action: label, entity: 'ae', entityId: aeId, detail: which === '24h' ? 'Initial SAE report submitted to CLA, Sponsor & EC — clock stopped' : which === '14d' ? 'SAE analysis report submitted — clock stopped' : 'EC opinion on SAE recorded — clock stopped' });
      },
      codeAE(aeId, pt, soc, decision, confidence) {
        set({ aes: get().aes.map((a) => (a.id === aeId ? { ...a, meddraPT: pt, meddraSOC: soc, codingStatus: 'Coded' } : a)) });
        get().log({ action: 'CODE', entity: 'ae', entityId: aeId, detail: `MedDRA PT "${pt}" (${soc}) ${decision === 'accepted' ? `accepted from AI suggestion${confidence !== undefined ? ` (confidence ${Math.round(confidence * 100)}%)` : ''}` : 'entered/edited manually by coder'}`, reason: 'Human-in-the-loop coding decision' });
      },
      rejectCoding(aeId, pt) {
        get().log({ action: 'CODE_REJECT', entity: 'ae', entityId: aeId, detail: `AI suggestion "${pt}" rejected by coder` });
      },
      setBatchStatus(batchId, status, reason) {
        set({ batches: get().batches.map((b) => (b.id === batchId ? { ...b, qcStatus: status } : b)) });
        get().log({ action: 'BATCH_STATUS', entity: 'batch', entityId: batchId, detail: `QC status → ${status}`, reason });
      },
      updateRule(rule, reason) {
        const before = get().rules.find((r) => r.id === rule.id);
        set({ rules: get().rules.map((r) => (r.id === rule.id ? rule : r)) });
        get().log({ action: 'RULE_UPDATE', entity: 'rule', entityId: rule.id, detail: `duration ${before?.durationHours}h→${rule.durationHours}h, amber ${before?.amberWithinHours}h→${rule.amberWithinHours}h, red ${before?.redWithinHours}h→${rule.redWithinHours}h, enabled ${before?.enabled}→${rule.enabled}`, reason });
      },
      resetRules() {
        set({ rules: DEFAULT_RULES });
        get().log({ action: 'RULE_RESET', entity: 'rule', entityId: '*', detail: 'Rules reset to NDCT 2019 defaults' });
      },
      addDeviation(d) {
        const s = get();
        const dev: Deviation = { ...d, id: `PD-${String(s.deviations.length + 1).padStart(3, '0')}` };
        set({ deviations: [dev, ...s.deviations] });
        get().log({ action: 'CREATE', entity: 'deviation', entityId: dev.id, detail: `${dev.severity} deviation (${dev.category}) for ${dev.participantId}` });
      },
      ecDecide(studyId, action, aeId) {
        if (action === 'approve-renewal') {
          const today = new Date();
          const exp = new Date(today.getTime() + 365 * 86400000);
          set({ studies: get().studies.map((s: Study) => (s.id === studyId ? { ...s, ecApprovalDate: today.toISOString().slice(0, 10), ecExpiryDate: exp.toISOString().slice(0, 10), ecRenewalStatus: 'Approved' } : s)) });
          get().log({ action: 'APPROVE', entity: 'ethics', entityId: studyId, detail: `Continuing review approved; valid until ${exp.toISOString().slice(0, 10)}` });
        } else if (action === 'request-changes') {
          get().log({ action: 'REQUEST_CHANGES', entity: 'ethics', entityId: studyId, detail: 'EC requested clarifications before renewal' });
        } else if (aeId) {
          get().reportSAE(aeId, 'ec');
        }
      },
      markCtriUpdated(studyId) {
        const today = new Date().toISOString().slice(0, 10);
        set({ studies: get().studies.map((s) => (s.id === studyId ? { ...s, ctriLastUpdated: today } : s)) });
        get().log({ action: 'UPDATE', entity: 'ctri', entityId: studyId, detail: 'CTRI record updated from generated packet' });
      },
      sign(entity, entityId, meaning, reason) {
        const s = get();
        const me = s.me();
        const entry = get().log({ action: 'ESIGN', entity, entityId, detail: `Electronic signature — meaning: "${meaning}" by ${me.name} (${s.role}); re-authenticated with password + TOTP`, reason });
        const sig: ESignature = { id: `SIG-${String(get().signatures.length + 1).padStart(4, '0')}`, signer: me.name, role: s.role, meaning, entity, entityId, ts: entry.ts, auditSeq: entry.seq };
        set({ signatures: [sig, ...get().signatures] });
        return sig;
      },
      decideAI(key, decision, detail) {
        const me = get().me();
        set({ aiDecisions: { ...get().aiDecisions, [key]: { key, decision, by: me.name, ts: new Date().toISOString() } } });
        get().log({ action: decision === 'accepted' ? 'AI_ACCEPT' : 'AI_DISMISS', entity: 'ai', entityId: key, detail });
      },
      enqueue(rec, offline) {
        const q: QueuedRecord = { ...rec, id: `Q-${Date.now().toString(36)}`, createdAt: new Date().toISOString(), createdOffline: offline };
        set({ syncQueue: [...get().syncQueue, q] });
        if (!offline) get().syncNow();
      },
      syncNow() {
        const q = get().syncQueue;
        if (!q.length) return 0;
        const visits: Visit[] = [...get().visits];
        q.forEach((r) => {
          if (r.kind === 'VS') {
            const p = r.payload;
            visits.push({ id: `V-${r.participantId}-x${r.id}`, participantId: r.participantId, studyId: r.participantId.slice(0, 3), visitName: String(p.visit), scheduled: String(p.date), actual: String(p.date), sbp: Number(p.sbp), dbp: Number(p.dbp), weight: Number(p.weight), status: 'Done' });
            get().log({ action: 'CREATE', entity: 'visit', entityId: r.participantId, detail: `VS record synced (${p.visit}, SBP ${p.sbp}/${p.dbp}, wt ${p.weight}kg)${r.createdOffline ? ' · captured offline at ' + r.createdAt : ''}` });
          } else {
            const p = r.payload;
            const part = get().participants.find((x) => x.id === r.participantId)!;
            const now = new Date().toISOString();
            get().addAE({ participantId: part.id, studyId: part.studyId, siteId: part.siteId, batchId: part.batchId, verbatim: String(p.term), codingStatus: 'Uncoded', severity: p.severity as AdverseEvent['severity'], serious: Boolean(p.serious), seriousCriteria: p.serious ? ['Hospitalisation'] : undefined, causality: 'Unassessable', outcome: 'Unknown', onsetAt: new Date(String(p.onset)).toISOString(), awareAt: r.createdAt ?? now, status: 'Open' });
          }
        });
        set({ visits, syncQueue: [] });
        return q.length;
      },
      setSimulateOffline(b) { set({ simulateOffline: b }); },
      tamper() {
        const s = get();
        if (s.tamperBackup || s.audit.length < 10) return;
        const idx = Math.floor(s.audit.length * 0.4);
        const orig = s.audit[idx];
        const forged = { ...orig, detail: orig.detail.replace(/"[^"]*"/, '"(silently edited)"') + ' [EDITED OUTSIDE APP]' };
        set({ tamperBackup: orig, audit: s.audit.map((e, i) => (i === idx ? forged : e)) });
      },
      restoreTamper() {
        const s = get();
        if (!s.tamperBackup) return;
        const b = s.tamperBackup;
        set({ audit: s.audit.map((e) => (e.seq === b.seq ? b : e)), tamperBackup: null });
      },
      setTour(step) { set({ tourStep: step }); },
    }),
    {
      name: 'trialsetu-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ready, tourStep, ...rest } = s;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function')) as Partial<State>;
      },
    },
  ),
);
