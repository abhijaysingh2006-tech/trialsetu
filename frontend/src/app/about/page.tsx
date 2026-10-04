'use client';

import {
  Network,
  Layers,
  Database,
  ShieldCheck,
  Server,
  Cpu,
  FileCode,
  Milestone,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PageHeader, Card, Badge } from '@/components/ui';

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        kicker="System Architecture & Implementation Matrix"
        title="Architecture & Phased Roadmap"
        subtitle="Technical design of TrialSetu: an auditable, role-based CTMS and pharmacovigilance platform for Ayurveda/ASU studies at AIIA and NPvCC (SIH 2026, PS SIH26046)."
      />

      {/* Real vs Mocked Matrix Banner */}
      <div className="card p-5 border-l-4 border-l-brand-600 bg-white">
        <h3 className="font-bold text-base text-slate-900 mb-1">
          Implementation Matrix: What is Real vs. Mocked in this Prototype
        </h3>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          In compliance with hackathon prototype constraints, all confidential enterprise software licences and national databases are cleanly decoupled through production-ready swappable adapter interfaces:
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 space-y-1">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" /> Fully Real & Functional
            </span>
            <ul className="text-slate-600 space-y-0.5 list-disc pl-4 text-[11px]">
              <li>SHA-256 hash-chained append-only audit trail</li>
              <li>Live verification & tamper detection engine</li>
              <li>NDCT 2019 statutory countdown clocks & rules</li>
              <li>Batch-to-AE disproportionality (PRR/χ² Evans)</li>
              <li>CDISC SDTM / ADaM dataset CSV generators</li>
              <li>Define-XML 2.1 schema generator</li>
              <li>Explainable human-in-the-loop AI models</li>
              <li>Offline PWA storage & sync queue</li>
              <li>Role-based access guard with audit logging</li>
            </ul>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 space-y-1">
            <span className="font-bold text-amber-900 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-amber-600" /> Cleanly Mocked / Seeded
            </span>
            <ul className="text-slate-600 space-y-0.5 list-disc pl-4 text-[11px]">
              <li><b>Clinical Data:</b> 100% synthetic trial dataset (12 studies, ~530 subjects, ~60 AEs)</li>
              <li><b>Identity Vault:</b> Opaque tokens instead of live Aadhaar/ABHA integration</li>
              <li><b>Keycloak OIDC:</b> Mock SSO persona flow with TOTP MFA simulation</li>
              <li><b>Terminology:</b> ~20 curated NAMASTE concepts (MedDRA/WHODrug require AIIA licence)</li>
              <li><b>FastAPI Backend:</b> Swappable in-browser generator vs HTTP REST API</li>
            </ul>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Server size={14} className="text-brand-700" /> Production Architecture
            </span>
            <ul className="text-slate-600 space-y-0.5 list-disc pl-4 text-[11px]">
              <li>Frontend: Next.js 14 / Tailwind / ECharts</li>
              <li>Backend: FastAPI / SQLAlchemy 2.0 / Pydantic</li>
              <li>Database: PostgreSQL 16 with append-only trigger</li>
              <li>Queue: Redis 7 + RQ worker for clock escalation</li>
              <li>Interoperability: HAPI FHIR R4 server proxy</li>
              <li>SSO Auth: Keycloak 25 with TOTP MFA</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Architecture Diagram */}
      <Card title="TrialSetu End-to-End System Architecture">
        <div className="p-4 bg-slate-950 rounded-xl text-brand-200 font-mono text-xs overflow-x-auto leading-relaxed">
          <pre>{`
 +-----------------------------------------------------------------------------------+
 |                             TrialSetu UI (Next.js 14)                             |
 |  [English / Hindi]  ·  [Offline PWA + IndexedDB]  ·  [Demo Role Persona Switcher] |
 +-----------------------------------------------------------------------------------+
           |                                       |                         |
           v                                       v                         v
 +-------------------+                   +-------------------+     +------------------+
 |  Statutory Clock  |                   |  ASU Batch-to-AE  |     |  Terminology     |
 |  & Escalation     |                   |  Traceability &   |     |  Bridge Adapter  |
 |  Engine (NDCT'19) |                   |  Signal Detection |     | (NAMASTE->MedDRA)|
 +-------------------+                   +-------------------+     +------------------+
           |                                       |                         |
           +---------------------------------------+-------------------------+
                                       |
                                       v
 +-----------------------------------------------------------------------------------+
 |                   Swappable Data Source Layer (Mock / HTTP REST)                  |
 +-----------------------------------------------------------------------------------+
           |                                                       |
           v                                                       v
 +------------------------------+                +-----------------------------------+
 | FastAPI Backend (Python 3.13)|                |   In-Browser Synthetic Generator  |
 | - OIDC Bearer Auth (Keycloak)|                |   - Seeded deterministic PRNG     |
 | - Statutory Clock Evaluator  |                |   - SHA-256 client hash chain     |
 | - FHIR R4 & SDTM Mappers     |                |   - Instant zero-dependency demo  |
 +------------------------------+                +-----------------------------------+
           |                         |                             |
           v                         v                             v
 +------------------+      +-------------------+         +-------------------+
 | PostgreSQL 16    |      | Redis 7 + RQ      |         | HAPI FHIR R4      |
 | - Append-only    |      | - Statutory Clock |         | - ResearchStudy   |
 |   Audit Trigger  |      |   Escalation      |         | - AdverseEvent    |
 | - DPDP Vault     |      |   Queue Worker    |         | - Medication      |
 +------------------+      +-------------------+         +-------------------+
`}</pre>
        </div>
      </Card>

      {/* Phased Project Roadmap */}
      <Card title="Phased Implementation Roadmap (AIIA / NPvCC Rollout)">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs">
                P1
              </div>
              <div className="h-full w-0.5 bg-emerald-200 mt-1" />
            </div>
            <div className="space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-900">Phase 1: Core CTMS & Statutory Clocks (Complete in Prototype)</h4>
                <Badge tone="green">Delivered</Badge>
              </div>
              <p className="text-xs text-slate-600">
                Study registry, live KPI dashboard, RBAC roles (Investigator, Ethics, PV, Leadership),
                NDCT Rules 2019 statutory countdown clocks with 4-tier escalation, batch-to-AE traceability,
                and SHA-256 hash-chained append-only audit trail.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white font-bold text-xs">
                P2
              </div>
              <div className="h-full w-0.5 bg-brand-200 mt-1" />
            </div>
            <div className="space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-900">Phase 2: FHIR/EDC Integration & Pharmacovigilance Production (Q2 2026)</h4>
                <Badge tone="brand">In Progress</Badge>
              </div>
              <p className="text-xs text-slate-600">
                Direct HAPI FHIR R4 proxying with custom AIIA StructureDefinitions for ASU formulations,
                offline PWA tablet deployment at AIIA hospital wards, and ingestion of licensed MedDRA/WHODrug ASCII dictionary releases.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-400 text-white font-bold text-xs">
                P3
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-900">Phase 3: CDISC SDTM/ADaM Pipeline & National PV Integration (Q4 2026)</h4>
                <Badge tone="slate">Planned</Badge>
              </div>
              <p className="text-xs text-slate-600">
                Pinnacle 21 automated validation pipeline for regulatory submission to CDSCO, automated electronic SUGAM/PvPI XML reporting,
                and multi-institutional federated learning across national Ayush institutes.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
