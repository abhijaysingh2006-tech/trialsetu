from typing import List, Dict, Any, Optional
import time

STANDARD_LADDER = [
    {"atPctElapsed": 0.0, "role": "investigator", "label": "Site Investigator"},
    {"atPctElapsed": 0.5, "role": "pv", "label": "PV Officer"},
    {"atPctElapsed": 0.75, "role": "pi", "label": "Principal Investigator"},
    {"atPctElapsed": 0.9, "role": "leadership", "label": "Leadership / Regulator desk"},
]

DEFAULT_RULES = [
    {
        "id": "SAE-24H",
        "name": "SAE initial report to CLA, Sponsor & Ethics Committee",
        "appliesTo": "SAE",
        "legalBasis": "NDCT Rules 2019 — SAE reporting by investigator within 24 h of occurrence/awareness (Third Schedule)",
        "startEvent": "Investigator becomes aware of SAE",
        "stopEvent": "Initial SAE report submitted",
        "durationHours": 24,
        "amberWithinHours": 8,
        "redWithinHours": 2,
        "enabled": True,
        "escalation": STANDARD_LADDER,
    },
    {
        "id": "SAE-14D",
        "name": "SAE report after due analysis",
        "appliesTo": "SAE",
        "legalBasis": "NDCT Rules 2019 — analysed SAE report to CLA, Chairperson of EC & head of institution within 14 days",
        "startEvent": "Investigator becomes aware of SAE",
        "stopEvent": "Analysis report submitted",
        "durationHours": 14 * 24,
        "amberWithinHours": 96,
        "redWithinHours": 24,
        "enabled": True,
        "escalation": STANDARD_LADDER,
    },
    {
        "id": "SAE-EC-30D",
        "name": "Ethics Committee opinion on SAE (incl. compensation)",
        "appliesTo": "SAE",
        "legalBasis": "NDCT Rules 2019 — EC to forward its report/opinion on SAE to CLA within 30 days of receipt",
        "startEvent": "Initial SAE report received by EC",
        "stopEvent": "EC opinion recorded",
        "durationHours": 30 * 24,
        "amberWithinHours": 7 * 24,
        "redWithinHours": 2 * 24,
        "enabled": True,
        "escalation": [
            {"atPctElapsed": 0.0, "role": "ethics", "label": "EC Member Secretary"},
            {"atPctElapsed": 0.75, "role": "pv", "label": "PV Officer"},
            {"atPctElapsed": 0.9, "role": "leadership", "label": "Leadership / Regulator desk"},
        ],
    },
    {
        "id": "EC-RENEWAL",
        "name": "Ethics approval continuing review / renewal",
        "appliesTo": "EC",
        "legalBasis": "NDCT Rules 2019 & ICMR National Ethical Guidelines 2017 — periodic review at EC-defined interval (default 12 months)",
        "startEvent": "EC approval date",
        "stopEvent": "Renewal submitted / approved",
        "durationHours": 365 * 24,
        "amberWithinHours": 60 * 24,
        "redWithinHours": 15 * 24,
        "enabled": True,
        "escalation": [
            {"atPctElapsed": 0.0, "role": "investigator", "label": "Principal Investigator"},
            {"atPctElapsed": 0.85, "role": "ethics", "label": "EC Member Secretary"},
            {"atPctElapsed": 0.96, "role": "leadership", "label": "Leadership / Regulator desk"},
        ],
    },
    {
        "id": "CTRI-PERIODIC",
        "name": "CTRI record periodic update",
        "appliesTo": "CTRI",
        "legalBasis": "CTRI registration requirement (NDCT Rules 2019) + AIIA SOP: refresh record every 6 months",
        "startEvent": "Last CTRI update",
        "stopEvent": "CTRI record updated",
        "durationHours": 180 * 24,
        "amberWithinHours": 30 * 24,
        "redWithinHours": 7 * 24,
        "enabled": True,
        "escalation": [
            {"atPctElapsed": 0.0, "role": "investigator", "label": "Principal Investigator"},
            {"atPctElapsed": 0.9, "role": "leadership", "label": "Research Cell"},
        ],
    },
]

def parse_iso(iso_str: str) -> int:
    from datetime import datetime, timezone
    if not iso_str:
        return 0
    # Clean ISO string if ends with Z or offset
    s = iso_str.replace("Z", "+00:00")
    if "T" not in s:
        s += "T00:00:00+00:00"
    dt = datetime.fromisoformat(s)
    return int(dt.timestamp() * 1000)

def status_for(rule: Dict[str, Any], now_ms: int, due_ms: int, stopped_ms: Optional[int]) -> str:
    if stopped_ms is not None:
        return "met" if stopped_ms <= due_ms else "met-late"
    rem = due_ms - now_ms
    if rem < 0:
        return "overdue"
    if rem <= rule["redWithinHours"] * 3600 * 1000:
        return "red"
    if rem <= rule["amberWithinHours"] * 3600 * 1000:
        return "amber"
    return "green"

def evaluate_clocks(rules: List[Dict[str, Any]], aes: List[Dict[str, Any]], studies: List[Dict[str, Any]], now_ms: int) -> List[Dict[str, Any]]:
    out = []
    H = 3600 * 1000
    rule_map = {r["id"]: r for r in rules}
    
    for ae in aes:
        if not ae.get("serious"):
            continue
        aware_ms = parse_iso(ae["awareAt"])
        label = f"{ae['id']} · {ae.get('meddraPT') or ae.get('verbatim')}"
        
        # 24H Rule
        r24 = rule_map.get("SAE-24H")
        if r24 and r24.get("enabled", True):
            due_ms = aware_ms + r24["durationHours"] * H
            stopped_ms = parse_iso(ae["reportedAt"]) if ae.get("reportedAt") else None
            st = status_for(r24, now_ms, due_ms, stopped_ms)
            pct = max(0.0, (now_ms - aware_ms) / max(1, due_ms - aware_ms))
            out.append({
                "key": f"SAE-24H:{ae['id']}",
                "ruleId": "SAE-24H",
                "ruleName": r24["name"],
                "appliesTo": "SAE",
                "entityId": ae["id"],
                "studyId": ae["studyId"],
                "label": label,
                "startAt": aware_ms,
                "dueAt": due_ms,
                "stoppedAt": stopped_ms,
                "status": st,
                "remainingMs": due_ms - now_ms,
                "pctElapsed": pct,
                "ladder": r24["escalation"],
            })
            
    return out
