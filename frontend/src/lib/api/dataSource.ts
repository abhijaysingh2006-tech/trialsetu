// Swappable data-source layer. The UI never talks to fetch() directly: it calls a
// DataSource. `mock` (default) generates synthetic data in-browser; `http` talks to the
// FastAPI backend (backend/app/main.py) which exposes the same shapes.
//   NEXT_PUBLIC_DATA_SOURCE=http NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev

import { generateSeed, type SeedData } from '../seed/generate';
import type { AdverseEvent, AuditEntry } from '../types';

export interface DataSource {
  id: 'mock' | 'http';
  loadSeed(now: number): Promise<SeedData>;
  /** Fire-and-forget write-through (mock: no-op; http: POST to backend which appends to the server audit chain). */
  pushAudit(entry: AuditEntry): Promise<void>;
  pushAE(ae: AdverseEvent): Promise<void>;
}

const mockSource: DataSource = {
  id: 'mock',
  async loadSeed(now) {
    return generateSeed(now);
  },
  async pushAudit() {},
  async pushAE() {},
};

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const httpSource: DataSource = {
  id: 'http',
  async loadSeed(now) {
    try {
      const r = await fetch(`${API}/api/v1/seed?now=${now}`);
      if (!r.ok) throw new Error(String(r.status));
      return (await r.json()) as SeedData;
    } catch (e) {
      console.warn('[TrialSetu] backend unreachable, falling back to mock data source', e);
      return generateSeed(now);
    }
  },
  async pushAudit(entry) {
    fetch(`${API}/api/v1/audit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry) }).catch(() => {});
  },
  async pushAE(ae) {
    fetch(`${API}/api/v1/aes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ae) }).catch(() => {});
  },
};

export const dataSource: DataSource = process.env.NEXT_PUBLIC_DATA_SOURCE === 'http' ? httpSource : mockSource;
