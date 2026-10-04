import hashlib
import json
from typing import List, Optional, Tuple, Dict, Any

GENESIS = "0" * 64

def canonical_json(entry: Dict[str, Any]) -> str:
    """Matches frontend canonical(e) exactly:
    JSON.stringify([e.seq, e.ts, e.actor, e.role, e.action, e.entity, e.entityId, e.detail, e.reason ?? '', e.prevHash])
    """
    arr = [
        entry["seq"],
        entry["ts"],
        entry["actor"],
        entry["role"],
        entry["action"],
        entry["entity"],
        entry["entityId"],
        entry["detail"],
        entry.get("reason") or "",
        entry["prevHash"],
    ]
    return json.dumps(arr, separators=(",", ":"), ensure_ascii=False)

def compute_hash(entry: Dict[str, Any]) -> str:
    canon = canonical_json(entry)
    return hashlib.sha256(canon.encode("utf-8")).hexdigest()

def make_entry(
    prev_entry: Optional[Dict[str, Any]],
    actor: str,
    role: str,
    action: str,
    entity: str,
    entity_id: str,
    detail: str,
    reason: Optional[str] = None,
    ts: Optional[str] = None,
) -> Dict[str, Any]:
    from datetime import datetime, timezone
    
    seq = (prev_entry["seq"] + 1) if prev_entry else 1
    prev_hash = prev_entry["hash"] if prev_entry else GENESIS
    timestamp = ts or datetime.now(timezone.utc).isoformat()
    
    base = {
        "seq": seq,
        "ts": timestamp,
        "actor": actor,
        "role": role,
        "action": action,
        "entity": entity,
        "entityId": entity_id,
        "detail": detail,
        "reason": reason or "",
        "prevHash": prev_hash,
    }
    
    h = compute_hash(base)
    base["hash"] = h
    return base

def verify_chain(log: List[Dict[str, Any]]) -> Dict[str, Any]:
    prev_hash = GENESIS
    for i, entry in enumerate(log):
        if entry["seq"] != i + 1:
            return {
                "ok": False,
                "checked": i,
                "brokenAt": entry["seq"],
                "problem": "Sequence gap (deleted or re-ordered entry)",
                "headHash": "",
            }
        if entry["prevHash"] != prev_hash:
            return {
                "ok": False,
                "checked": i,
                "brokenAt": entry["seq"],
                "problem": "prevHash does not match previous entry hash",
                "headHash": "",
            }
        
        expected_hash = compute_hash(entry)
        if entry["hash"] != expected_hash:
            return {
                "ok": False,
                "checked": i,
                "brokenAt": entry["seq"],
                "problem": "Content hash mismatch (entry was modified)",
                "headHash": "",
            }
        prev_hash = entry["hash"]
        
    return {
        "ok": True,
        "checked": len(log),
        "headHash": prev_hash,
        "problem": None,
    }
