import time
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Depends, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .seed import generate_seed_data
from .rules import DEFAULT_RULES, evaluate_clocks
from .audit import verify_chain, make_entry
from .auth import get_current_user, require_role, CurrentUser

app = FastAPI(
    title="TrialSetu API",
    description="Live, auditable CTMS & Pharmacovigilance for Ayurveda/ASU studies at AIIA and NPvCC (SIH 2026, PS SIH26046)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store (initialized on first call or when DATABASE_URL unset)
_STORE: Dict[str, Any] = {}
_AUDIT_LOG: List[Dict[str, Any]] = []

def get_store(now_ms: Optional[int] = None) -> Dict[str, Any]:
    global _STORE, _AUDIT_LOG
    if not _STORE:
        seed = generate_seed_data(now_ms)
        _STORE = seed
        # Initialize genesis audit block
        genesis = make_entry(
            prev_entry=None,
            actor="system",
            role="system",
            action="CHAIN_GENESIS",
            entity="audit",
            entity_id="genesis",
            detail="Append-only audit chain initialised (FastAPI backend SHA-256)",
        )
        _AUDIT_LOG.append(genesis)
    return _STORE

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "TrialSetu CTMS & PV Engine",
        "version": "1.0.0",
        "timestamp": time.time(),
    }

@app.get("/api/v1/seed")
def get_seed(now: Optional[int] = Query(None)):
    store = get_store(now)
    return store

@app.get("/api/v1/studies")
def list_studies(user: CurrentUser = Depends(get_current_user)):
    store = get_store()
    studies = store.get("studies", [])
    if user.role == "investigator":
        # Scoped investigator view
        return [s for s in studies if s["id"] in ["T10", "T11"]]
    return studies

@app.get("/api/v1/aes")
def list_aes(user: CurrentUser = Depends(get_current_user)):
    store = get_store()
    return store.get("aes", [])

class AdverseEventCreate(BaseModel):
    participantId: str
    studyId: str
    siteId: str
    batchId: Optional[str] = None
    verbatim: str
    namasteTerm: Optional[str] = None
    severity: str
    serious: bool = False
    seriousCriteria: Optional[List[str]] = None
    causality: str = "Possible"
    outcome: str = "Recovering"
    onsetAt: str
    awareAt: str
    narrative: Optional[str] = None

@app.post("/api/v1/aes")
def create_ae(
    payload: AdverseEventCreate,
    user: CurrentUser = Depends(require_role(["investigator", "pv"])),
):
    global _STORE, _AUDIT_LOG
    store = get_store()
    aes = store.get("aes", [])
    new_id = f"AE-{str(len(aes) + 1).zfill(4)}"
    ae_dict = payload.model_dump()
    ae_dict["id"] = new_id
    ae_dict["status"] = "Open"
    ae_dict["codingStatus"] = "Uncoded"

    aes.insert(0, ae_dict)
    store["aes"] = aes

    # Record in audit trail
    last_audit = _AUDIT_LOG[-1] if _AUDIT_LOG else None
    audit_entry = make_entry(
        prev_entry=last_audit,
        actor=user.name,
        role=user.role,
        action="CREATE",
        entity="ae",
        entity_id=new_id,
        detail=f"AE entered: '{payload.verbatim}' (Subject: {payload.participantId}, Batch: {payload.batchId or 'None'})",
    )
    _AUDIT_LOG.append(audit_entry)

    return ae_dict

@app.get("/api/v1/clocks")
def get_clocks(now: Optional[int] = Query(None)):
    store = get_store(now)
    now_ms = now or int(time.time() * 1000)
    clocks = evaluate_clocks(DEFAULT_RULES, store.get("aes", []), store.get("studies", []), now_ms)
    return clocks

@app.get("/api/v1/audit")
def get_audit_trail(user: CurrentUser = Depends(get_current_user)):
    get_store()
    return _AUDIT_LOG

@app.post("/api/v1/audit")
def push_audit_entry(
    entry: Dict[str, Any],
    user: CurrentUser = Depends(get_current_user),
):
    global _AUDIT_LOG
    get_store()
    last_audit = _AUDIT_LOG[-1] if _AUDIT_LOG else None
    new_entry = make_entry(
        prev_entry=last_audit,
        actor=entry.get("actor", user.name),
        role=entry.get("role", user.role),
        action=entry.get("action", "MUTATION"),
        entity=entry.get("entity", "system"),
        entity_id=entry.get("entityId", "*"),
        detail=entry.get("detail", "Client audit record"),
        reason=entry.get("reason"),
    )
    _AUDIT_LOG.append(new_entry)
    return new_entry

@app.get("/api/v1/audit/verify")
def verify_audit_chain():
    get_store()
    return verify_chain(_AUDIT_LOG)

@app.get("/api/v1/fhir/ResearchStudy/{study_id}")
def fhir_research_study(study_id: str):
    store = get_store()
    study = next((s for s in store.get("studies", []) if s["id"] == study_id), None)
    if not study:
        raise HTTPException(status_code=404, detail="ResearchStudy not found")
    
    return {
        "resourceType": "ResearchStudy",
        "id": study["id"],
        "identifier": [
            {"system": "https://ctri.nic.in", "value": study["ctriNo"]},
            {"system": "urn:aiia:protocol", "value": study["code"]},
        ],
        "title": study["title"],
        "status": "active" if study["status"] == "Recruiting" else "in-review",
        "condition": [{"text": f"{study['ayurvedaCondition']} ({study['condition']})"}],
        "sponsor": {"display": study["sponsor"]},
        "principalInvestigator": {"display": study["piName"]},
    }
