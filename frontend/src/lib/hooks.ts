'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStore } from './store';
import { translate, type TKey } from './i18n';
import { evaluateClocks } from './rules';
import { can, ROLES, type Permission } from './rbac';

/** Ticking clock for live countdowns. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useT() {
  const lang = useStore((s) => s.lang);
  return (k: TKey) => translate(lang, k);
}

export function useClocks(intervalMs = 1000) {
  const now = useNow(intervalMs);
  const rules = useStore((s) => s.rules);
  const aes = useStore((s) => s.aes);
  const studies = useStore((s) => s.studies);
  const clocks = useMemo(() => evaluateClocks(rules, aes, studies, now), [rules, aes, studies, now]);
  return { now, clocks };
}

export function useCan(p: Permission) {
  const role = useStore((s) => s.role);
  return can(role, p);
}

export function useRoleDef() {
  const role = useStore((s) => s.role);
  return ROLES[role];
}

/** Investigators only see their own studies; other roles see the full portfolio. */
export function useScopedStudies() {
  const role = useStore((s) => s.role);
  const studies = useStore((s) => s.studies);
  const users = useStore((s) => s.users);
  return useMemo(() => {
    if (role !== 'investigator') return studies;
    const me = users.find((u) => u.role === 'investigator');
    return studies.filter((s) => me?.studyIds?.includes(s.id));
  }, [role, studies, users]);
}
