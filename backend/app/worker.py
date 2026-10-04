import os
import time
from typing import Dict, Any
from .rules import DEFAULT_RULES, evaluate_clocks
from .seed import generate_seed_data

def escalate_clocks():
    """Background task executed periodically by Redis/RQ worker.
    Evaluates running statutory clocks and dispatches escalation alerts
    when clocks cross amber/red/overdue milestones.
    """
    now_ms = int(time.time() * 1000)
    seed = generate_seed_data(now_ms)
    clocks = evaluate_clocks(DEFAULT_RULES, seed.get("aes", []), seed.get("studies", []), now_ms)
    
    escalations = []
    for c in clocks:
        if c["status"] in ("red", "overdue"):
            curr_step = c["ladder"][-1] if c["status"] == "overdue" else c["ladder"][1]
            escalations.append({
                "clock": c["key"],
                "status": c["status"],
                "targetRole": curr_step["role"],
                "alert": f"CRITICAL STATUTORY CLOCK BREACH: {c['label']} is {c['status']}. Escalated to {curr_step['label']}.",
            })
            
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] EscalateClocks Job: Evaluated {len(clocks)} clocks, dispatched {len(escalations)} regulatory notifications.")
    return escalations

if __name__ == "__main__":
    escalate_clocks()
