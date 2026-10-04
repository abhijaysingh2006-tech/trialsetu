import { sha256 } from './sha256';
import type { AuditEntry, RoleId } from './types';

export const GENESIS = '0'.repeat(64);

export type AuditInput = {
  actor: string;
  role: RoleId | 'system';
  action: string;
  entity: string;
  entityId: string;
  detail: string;
  reason?: string;
  ts?: string;
};

function canonical(e: Omit<AuditEntry, 'hash'>): string {
  // Fixed key order => deterministic hash input.
  return JSON.stringify([e.seq, e.ts, e.actor, e.role, e.action, e.entity, e.entityId, e.detail, e.reason ?? '', e.prevHash]);
}

export function makeEntry(prev: AuditEntry | undefined, input: AuditInput): AuditEntry {
  const base: Omit<AuditEntry, 'hash'> = {
    seq: prev ? prev.seq + 1 : 1,
    ts: input.ts ?? new Date().toISOString(),
    actor: input.actor,
    role: input.role,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId,
    detail: input.detail,
    reason: input.reason,
    prevHash: prev ? prev.hash : GENESIS,
  };
  return { ...base, hash: sha256(canonical(base)) };
}

export interface VerifyResult {
  ok: boolean;
  checked: number;
  brokenAt?: number;
  problem?: string;
  headHash: string;
  ms: number;
}

/** Re-computes every hash and link. Any edit/delete/reorder breaks the chain. */
export function verifyChain(log: AuditEntry[]): VerifyResult {
  const t0 = performance.now();
  let prevHash = GENESIS;
  for (let i = 0; i < log.length; i++) {
    const e = log[i];
    if (e.seq !== i + 1) return { ok: false, checked: i, brokenAt: e.seq, problem: 'Sequence gap (deleted or re-ordered entry)', headHash: '', ms: performance.now() - t0 };
    if (e.prevHash !== prevHash) return { ok: false, checked: i, brokenAt: e.seq, problem: 'prevHash does not match previous entry hash', headHash: '', ms: performance.now() - t0 };
    const { hash, ...rest } = e;
    if (sha256(canonical(rest)) !== hash) return { ok: false, checked: i, brokenAt: e.seq, problem: 'Content hash mismatch (entry was modified)', headHash: '', ms: performance.now() - t0 };
    prevHash = hash;
  }
  return { ok: true, checked: log.length, headHash: prevHash, ms: performance.now() - t0 };
}
