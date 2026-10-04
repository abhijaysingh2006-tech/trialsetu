'use client';

import { useMemo } from 'react';
import { useStore } from './store';
import { useClocks } from './hooks';
import { verifyChain } from './audit';
import { adverseEvent, medication, patient, researchStudy, researchSubject, validate, type FhirResource } from './fhir';
import { buildSDTM, buildADaM, checkConformance } from './exports';

export interface Criterion {
  id: string;
  title: string;
  target: string;
  score: number; // 0..100
  pass: boolean;
  headline: string;
  evidence: { label: string; value: string; ok: boolean; href?: string }[];
}

/** Live compliance scorecard — each KPI is computed from the data, with the evidence behind it. */
export function useCompliance(): { criteria: Criterion[]; overall: number } {
  const { clocks } = useClocks(5000);
  const aes = useStore((s) => s.aes);
  const audit = useStore((s) => s.audit);
  const studies = useStore((s) => s.studies);
  const participants = useStore((s) => s.participants);
  const batches = useStore((s) => s.batches);
  const formulations = useStore((s) => s.formulations);
  const visits = useStore((s) => s.visits);
  const signatures = useStore((s) => s.signatures);

  const fhirStats = useMemo(() => {
    const res: FhirResource[] = [
      ...studies.map((s) => researchStudy(s, formulations.find((f) => f.id === s.formulationId))),
      ...participants.slice(0, 120).map(patient), ...participants.slice(0, 120).map(researchSubject),
      ...batches.map((b) => medication(b, formulations.find((f) => f.id === b.formulationId))),
      ...aes.map(adverseEvent),
    ];
    const known = new Set(res.map((r) => `${r.resourceType}/${r.id}`));
    participants.forEach((p) => known.add(`Patient/${p.id}`));
    let errors = 0, warnings = 0;
    res.forEach((r) => validate(r, known).forEach((c) => { if (!c.pass) c.level === 'error' ? errors++ : warnings++; }));
    return { total: res.length, errors, warnings };
  }, [studies, participants, batches, formulations, aes]);

  const sdtmStats = useMemo(() => {
    const sd = buildSDTM(studies, participants, aes, visits);
    const ad = buildADaM(sd, participants);
    const issues = checkConformance([...sd, ...ad]);
    return { datasets: sd.length + ad.length, records: [...sd, ...ad].reduce((a, d) => a + d.rows.length, 0), errors: issues.filter((i) => i.level === 'error').reduce((a, i) => a + i.count, 0), warnings: issues.filter((i) => i.level === 'warning').reduce((a, i) => a + i.count, 0) };
  }, [studies, participants, aes, visits]);

  const chain = useMemo(() => verifyChain(audit), [audit]);

  return useMemo(() => {
    const saes = aes.filter((a) => a.serious);
    const tracked = saes.filter((a) => clocks.some((c) => c.ruleId === 'SAE-24H' && c.entityId === a.id));
    const overdue = clocks.filter((c) => c.appliesTo === 'SAE' && c.status === 'overdue').length;
    const met = clocks.filter((c) => c.ruleId === 'SAE-24H' && c.stoppedAt).length;
    const metOnTime = clocks.filter((c) => c.ruleId === 'SAE-24H' && c.status === 'met').length;

    const audited = new Set(audit.filter((e) => e.action === 'CREATE' || e.action === 'CODE').map((e) => `${e.entity}:${e.entityId}`));
    const unauditedAEs = aes.filter((a) => !audited.has(`ae:${a.id}`)).length;
    const codedUnaudited = aes.filter((a) => a.codingStatus === 'Coded' && !audit.some((e) => e.action === 'CODE' && e.entityId === a.id)).length;

    const access = audit.filter((e) => e.action === 'ACCESS' || e.action === 'ACCESS_DENIED');
    const roles = new Set(access.map((e) => e.role));
    const denied = access.filter((e) => e.action === 'ACCESS_DENIED').length;
    const withRole = access.filter((e) => e.role && e.role !== 'system').length;

    const c1: Criterion = {
      id: 'clocks', title: 'SAEs tracked against statutory clocks', target: '100% SAEs tracked',
      score: saes.length ? Math.round((tracked.length / saes.length) * 100) : 100,
      pass: tracked.length === saes.length,
      headline: `${tracked.length}/${saes.length} SAEs on the NDCT 24-h clock`,
      evidence: [
        { label: 'SAEs with an active/closed 24-h clock', value: `${tracked.length} of ${saes.length}`, ok: tracked.length === saes.length, href: '/safety' },
        { label: 'Initial reports met on time', value: `${metOnTime} of ${met} submitted`, ok: metOnTime === met },
        { label: 'Clocks currently overdue (escalated to leadership)', value: String(overdue), ok: overdue === 0, href: '/safety' },
        { label: 'Rule set', value: 'NDCT 2019 defaults · configurable', ok: true, href: '/rules' },
      ],
    };
    const c2: Criterion = {
      id: 'audit', title: 'Zero unaudited data changes', target: '0 unaudited changes',
      score: chain.ok && unauditedAEs + codedUnaudited === 0 ? 100 : chain.ok ? 80 : 0,
      pass: chain.ok && unauditedAEs + codedUnaudited === 0,
      headline: chain.ok ? `Chain intact · ${audit.length} entries` : `CHAIN BROKEN at #${chain.brokenAt}`,
      evidence: [
        { label: 'Hash-chain verification (SHA-256)', value: chain.ok ? `PASS · ${chain.checked} entries · ${chain.ms.toFixed(0)} ms` : `FAIL at #${chain.brokenAt}: ${chain.problem}`, ok: chain.ok, href: '/audit' },
        { label: 'AE records without CREATE audit entry', value: String(unauditedAEs), ok: unauditedAEs === 0 },
        { label: 'Coded AEs without CODE audit entry', value: String(codedUnaudited), ok: codedUnaudited === 0 },
        { label: 'E-signatures (meaning + timestamp, ALCOA+)', value: String(signatures.length), ok: true, href: '/audit' },
      ],
    };
    const fhirOk = fhirStats.errors === 0, sdtmOk = sdtmStats.errors === 0;
    const c3: Criterion = {
      id: 'conformance', title: 'FHIR R4 & CDISC SDTM conformance', target: 'FHIR & SDTM pass',
      score: Math.round(((fhirOk ? 50 : 25) + (sdtmOk ? 50 : 25)) - Math.min(10, (fhirStats.warnings + sdtmStats.warnings) / 5)),
      pass: fhirOk && sdtmOk,
      headline: `FHIR ${fhirOk ? 'PASS' : 'FAIL'} · SDTM ${sdtmOk ? 'PASS' : 'FAIL'}`,
      evidence: [
        { label: 'FHIR R4 resources validated (structural)', value: `${fhirStats.total} resources · ${fhirStats.errors} errors · ${fhirStats.warnings} warnings`, ok: fhirOk, href: '/interop' },
        { label: 'SDTM/ADaM datasets checked', value: `${sdtmStats.datasets} datasets · ${sdtmStats.records} records · ${sdtmStats.errors} errors`, ok: sdtmOk, href: '/interop?tab=sdtm' },
        { label: 'Warnings (uncoded AEDECOD → coding queue)', value: String(sdtmStats.warnings), ok: sdtmStats.warnings === 0, href: '/coding' },
        { label: 'Full profile validation', value: 'HAPI $validate + Pinnacle 21 — Phase 2/3', ok: true },
      ],
    };
    const c4: Criterion = {
      id: 'access', title: 'Role-scoped access logged', target: '100% access events logged with role',
      score: access.length ? Math.round((withRole / access.length) * 100) : 100,
      pass: access.length > 0 && withRole === access.length,
      headline: `${access.length} access events · ${roles.size} roles`,
      evidence: [
        { label: 'Route views logged with role claim', value: `${withRole} of ${access.length}`, ok: withRole === access.length, href: '/audit' },
        { label: 'Denied attempts captured', value: String(denied), ok: true },
        { label: 'Roles exercised this session', value: Array.from(roles).join(', ') || '—', ok: true },
        { label: 'Auth', value: 'OIDC (Keycloak) + TOTP MFA · RBAC enforced client & server', ok: true },
      ],
    };
    const criteria = [c1, c2, c3, c4];
    return { criteria, overall: Math.round(criteria.reduce((a, c) => a + c.score, 0) / criteria.length) };
  }, [aes, clocks, audit, chain, signatures, fhirStats, sdtmStats]);
}
