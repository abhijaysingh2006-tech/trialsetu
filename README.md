# TrialSetu (ट्रायल-सेतु) 🌿
### Live, Auditable Clinical Trial Management System (CTMS) & Pharmacovigilance for Ayurveda / ASU Studies
**Smart India Hackathon 2026 | Problem Statement SIH26046**  
**Lead Institutions:** All India Institute of Ayurveda (AIIA), New Delhi & National Pharmacovigilance Coordination Centre (NPvCC)

---

> **Important Notice:** In compliance with SIH guidelines, this prototype utilizes **100% synthetic clinical data**. No real patient identifiers (PII/PHI) or proprietary hospital records are stored or exposed.

---

## 🌟 Key Highlights & Evaluation Criteria Mapping

| Evaluation Target | Implementation in TrialSetu | Evidence Location |
| :--- | :--- | :--- |
| **1. 100% SAEs Tracked Against Clocks** | Live statutory countdown timers under **NDCT Rules 2019** (24h initial report, 14d analysis, 30d EC opinion) with a 4-tier escalation ladder (Investigator → PV → PI → Leadership). | `/safety`, `/rules` |
| **2. Zero Unaudited Data Changes** | SHA-256 hash-chained append-only audit trail with live cryptographic integrity verification, tamper simulation, and 21 CFR Part 11 e-signatures. | `/audit` |
| **3. FHIR & SDTM Conformance Pass** | HL7 HAPI FHIR R4 interoperability resources with structural validation; CDISC SDTM/ADaM CSV datasets with Define-XML 2.1 schema generator. | `/interop` |
| **4. Role-Scoped Access Logged** | Keycloak-style OIDC RBAC (Investigator, Ethics Committee, PV Officer, Leadership/Regulator) with client & server route guards and auditable access logs. | Top-right switcher, `/audit` |

---

## 🧭 3-Minute Live Demo Flow

To demonstrate the full end-to-end lifecycle in under 3 minutes, click the **"Demo Tour"** button in the header or follow this sequence:

```
[1. Leadership Portfolio] ➔ [2. Study Drill-Down] ➔ [3. SAE 24h Clock] ➔ [4. Batch-to-AE Trace]
                                                                                │
[7. CTRI Export Packet]  ⬅  [6. Audit-Trail Verify] ⬅  [5. Terminology Bridge]  ⬅
```

1. **Leadership Portfolio (`/`):** View the real-time, read-only portfolio of 12 synthetic Ayurveda trials, multi-centre recruitment pace, and the live compliance scorecard.
2. **Study Drill-Down (`/studies/T10`):** Inspect *Kaishore Guggulu in Knee Osteoarthritis (Sandhigata Vata)*, site-by-site enrolment, and AI enrolment-lag forecast.
3. **SAE Statutory Clock (`/safety?focus=AE-0001`):** Observe an acute hospitalised SAE with the 24-hour statutory countdown clock in red, notice the multi-tier escalation ladder, and e-sign the report.
4. **Batch-to-AE Traceability (`/batches/B-KSG-2606`):** Trace the SAE directly to formulation batch `KSG/26/06`. Notice the Evans criteria disproportionality signal ($PRR \ge 2, \chi^2 \ge 4$) triggering an alert for hepatic enzyme elevation; test the quarantine action.
5. **NAMASTE-to-MedDRA Terminology Bridge (`/coding?ae=AE-0001`):** Enter classical Ayurveda term *Kamala (Pittaja)* or *Amlapitta*; observe the pluggable adapter generate MedDRA Preferred Term suggestions with confidence and human-in-the-loop accept/reject controls.
6. **Cryptographic Audit Verification (`/audit`):** Run "Verify chain" to validate SHA-256 block links across the sequence; click "Simulate tampering" to observe immediate mathematical detection of modified data.
7. **CTRI Packet Export (`/interop?tab=packets&study=T10`):** Generate and download the hashed, tamper-proof CTRI regulatory update dossier (HTML & JSON).

---

## 🏗️ Architecture Diagram

```
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
```

---

## ⚖️ Real vs. Mocked Implementation Matrix

| Component | Status | Details |
| :--- | :--- | :--- |
| **Audit Ledger** | **REAL** | Pure SHA-256 cryptographic chaining (FIPS 180-4); full sequential verification; tamper detection; ALCOA+ e-signatures. |
| **Statutory Clocks** | **REAL** | Live ticking interval countdowns; NDCT 2019 threshold evaluators; dynamic escalation ladders. |
| **Batch Disproportionality** | **REAL** | Evans statistical criteria ($PRR \ge 2.0, \chi^2 \ge 4.0, n \ge 3$) computed over batch denominators. |
| **CDISC & FHIR Generators** | **REAL** | Real CSV generation for DM, AE, EX, VS, ADSL, ADAE; valid Define-XML 2.1 schema; valid FHIR R4 resource mappers. |
| **Offline-First PWA** | **REAL** | Service worker shell caching, local storage queues, and background sync simulator. |
| **Clinical Trial Data** | *MOCKED* | 100% synthetic dataset (12 studies, 8 sites, ~530 subjects, 5 batches, ~60 AEs). |
| **Identity Vault** | *MOCKED* | Opaque vault tokens simulate isolated database without requiring live national ID APIs. |
| **Enterprise Licences** | *ADAPTER* | Shipped with curated ~20-concept NAMASTE/TM2 bridge; MedDRA (MSSO) and WHODrug (UMC) require institutional AIIA licences. |
| **OIDC / Keycloak** | *HYBRID* | In-browser demo role switcher with TOTP MFA simulation; full Docker Compose Keycloak realm provided for production deployment. |

---

## 🚀 Running the Project

### Option A: Instant Zero-Dependency Frontend (Recommended for Judging)
The frontend includes a self-contained, browser-executable synthetic data generator and SHA-256 engine:

```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.  
*Sign-in tip:* In the demo login modal, click **"Continue"** (password `demo`), enter any 6 digits (or click *"Demo: autofill code"*), and start exploring!

---

### Option B: Full Production Docker Stack
Includes Next.js UI, FastAPI REST API, PostgreSQL 16 with append-only triggers, Redis 7 worker, HAPI FHIR R4, and Keycloak SSO:

```bash
# From the trialsetu directory
docker compose up --build
```
- **Web Portal:** [http://localhost:3000](http://localhost:3000)
- **FastAPI Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **HAPI FHIR R4 Server:** [http://localhost:8080](http://localhost:8080)
- **Keycloak Admin:** [http://localhost:8081](http://localhost:8081) (`admin` / `admin`)

---

## 🗺️ Phased Implementation Roadmap

- **Phase 1: Core CTMS & Pharmacovigilance (Completed in this prototype)**
  - Protocol registry & multi-centre tracking for 12 AIIA trials
  - NDCT Rules 2019 statutory countdown clocks & multi-tier escalation
  - Formulation batch-to-AE traceability & disproportionality signal detection
  - SHA-256 hash-chained append-only audit trail with tamper detection
  - DPDP Act 2023 purpose-specific consent ledger & pseudonymised vault

- **Phase 2: Production FHIR & Hospital Ward EDC (Q2 2026)**
  - Native integration with hospital EHRs at AIIA Sarita Vihar and Goa campus
  - Offline tablet PWA roll-out for OPD/IPD data collection
  - Ingestion of licensed MedDRA and WHODrug releases

- **Phase 3: National Regulatory Pipeline (Q4 2026)**
  - Automated electronic reporting to CDSCO SUGAM and NPvCC PvPI portals
  - SAS XPT v5 export with Pinnacle 21 validation suites
  - Federated multi-institute safety analytics across national Ayush centres
