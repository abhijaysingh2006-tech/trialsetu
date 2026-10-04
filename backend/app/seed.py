import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List

DAY_MS = 86400 * 1000
HOUR_MS = 3600 * 1000

def generate_seed_data(now_ms: int = None) -> Dict[str, Any]:
    if now_ms is None:
        now_ms = int(time.time() * 1000)

    now_dt = datetime.fromtimestamp(now_ms / 1000, tz=timezone.utc)
    now_iso = now_dt.isoformat()

    def dt_str(days_offset: float = 0, hours_offset: float = 0) -> str:
        d = now_dt + timedelta(days=days_offset, hours=hours_offset)
        return d.isoformat()

    def date_str(days_offset: float = 0) -> str:
        d = now_dt + timedelta(days=days_offset)
        return d.strftime("%Y-%m-%d")

    users = [
        {"id": "U-INV-01", "name": "Dr. Meera Iyer", "role": "investigator", "title": "Principal Investigator · AIIA New Delhi", "siteId": "S01", "studyIds": ["T10", "T11"]},
        {"id": "U-EC-01", "name": "Prof. R. K. Sharma", "role": "ethics", "title": "Member Secretary · Institutional Ethics Committee"},
        {"id": "U-PV-01", "name": "Dr. Anjali Verma", "role": "pv", "title": "Pharmacovigilance Officer · AIIA PV Cell / NPvCC"},
        {"id": "U-LD-01", "name": "Dr. S. Rao", "role": "leadership", "title": "Dean (Research) · Read-only regulator view"},
    ]

    sites = [
        {"id": "S01", "name": "AIIA Sarita Vihar (Hospital Block)", "city": "New Delhi", "state": "Delhi"},
        {"id": "S02", "name": "AIIA Goa Campus", "city": "Dhargal", "state": "Goa"},
        {"id": "S03", "name": "Partner Ayurveda Hospital – Jaipur", "city": "Jaipur", "state": "Rajasthan"},
        {"id": "S04", "name": "Partner Ayurveda Hospital – Jamnagar", "city": "Jamnagar", "state": "Gujarat"},
        {"id": "S05", "name": "Partner Ayurveda Hospital – Varanasi", "city": "Varanasi", "state": "Uttar Pradesh"},
        {"id": "S06", "name": "Partner Ayurveda Hospital – Bhubaneswar", "city": "Bhubaneswar", "state": "Odisha"},
        {"id": "S07", "name": "Partner Ayurveda Hospital – Pune", "city": "Pune", "state": "Maharashtra"},
        {"id": "S08", "name": "Partner Ayurveda Hospital – Thiruvananthapuram", "city": "Thiruvananthapuram", "state": "Kerala"},
    ]

    formulations = [
        {"id": "F-ASH", "name": "Ashwagandha Churna", "nameHi": "अश्वगंधा चूर्ण", "dosageForm": "Churna (powder), 3 g BD", "ingredients": "Withania somnifera (root)", "reference": "Ayurvedic Formulary of India, Pt I"},
        {"id": "F-GUD", "name": "Guduchi Ghanavati", "nameHi": "गुडूची घनवटी", "dosageForm": "Ghanavati (tablet), 500 mg BD", "ingredients": "Tinospora cordifolia (stem) aqueous extract", "reference": "Ayurvedic Pharmacopoeia of India"},
        {"id": "F-TRI", "name": "Triphala Churna", "nameHi": "त्रिफला चूर्ण", "dosageForm": "Churna (powder), 5 g HS", "ingredients": "Haritaki, Bibhitaki, Amalaki (equal parts)", "reference": "Sharangadhara Samhita"},
        {"id": "F-KSG", "name": "Kaishore Guggulu", "nameHi": "कैशोर गुग्गुलु", "dosageForm": "Vati (tablet), 500 mg TDS", "ingredients": "Guggulu, Guduchi, Triphala, Trikatu, Trivrit, Danti", "reference": "Bhaishajya Ratnavali, Vatarakta Chikitsa"},
    ]

    batches = [
        {"id": "B-ASH-2604", "formulationId": "F-ASH", "batchNo": "ASH/26/04", "manufacturer": "AIIA GMP Pharmacy (synthetic)", "mfgDate": "2026-04-12", "expiryDate": "2028-04-11", "qcStatus": "Released", "heavyMetalsPass": True, "microbialPass": True, "unitsDispensed": 105},
        {"id": "B-GUD-2603", "formulationId": "F-GUD", "batchNo": "GUD/26/03", "manufacturer": "AIIA GMP Pharmacy (synthetic)", "mfgDate": "2026-03-02", "expiryDate": "2028-03-01", "qcStatus": "Released", "heavyMetalsPass": True, "microbialPass": True, "unitsDispensed": 85},
        {"id": "B-TRI-2605", "formulationId": "F-TRI", "batchNo": "TRI/26/05", "manufacturer": "Licensed ASU Mfr. – Unit 7 (synthetic)", "mfgDate": "2026-05-20", "expiryDate": "2028-05-19", "qcStatus": "Released", "heavyMetalsPass": True, "microbialPass": True, "unitsDispensed": 92},
        {"id": "B-KSG-2602", "formulationId": "F-KSG", "batchNo": "KSG/26/02", "manufacturer": "AIIA GMP Pharmacy (synthetic)", "mfgDate": "2026-02-08", "expiryDate": "2028-02-07", "qcStatus": "Released", "heavyMetalsPass": True, "microbialPass": True, "unitsDispensed": 65},
        {"id": "B-KSG-2606", "formulationId": "F-KSG", "batchNo": "KSG/26/06", "manufacturer": "Licensed ASU Mfr. – Unit 3 (synthetic)", "mfgDate": "2026-06-15", "expiryDate": "2028-06-14", "qcStatus": "Released", "heavyMetalsPass": True, "microbialPass": True, "unitsDispensed": 58},
    ]

    studies_def = [
        {"id": "T01", "title": "Ashwagandha Churna in Generalised Anxiety Disorder", "titleHi": "सामान्यीकृत चिंता विकार में अश्वगंधा चूर्ण", "ayur": "Chittodvega", "cond": "Generalised anxiety disorder", "f": "F-ASH", "phase": "Phase III", "status": "Recruiting", "target": 120, "enrolled": 72, "sites": ["S01", "S02", "S03", "S07"], "design": "Randomised, double-blind, placebo-controlled, parallel"},
        {"id": "T02", "title": "Ashwagandha Churna in Primary Insomnia", "titleHi": "प्राथमिक अनिद्रा में अश्वगंधा चूर्ण", "ayur": "Anidra", "cond": "Primary insomnia", "f": "F-ASH", "phase": "Phase II", "status": "Recruiting", "target": 80, "enrolled": 50, "sites": ["S01", "S05", "S08"], "design": "Randomised, open-label, active-controlled"},
        {"id": "T03", "title": "Ashwagandha Rasayana in Age-related Sarcopenia", "titleHi": "वृद्धावस्था सार्कोपेनिया में अश्वगंधा रसायन", "ayur": "Jara (Rasayana)", "cond": "Sarcopenia", "f": "F-ASH", "phase": "Phase II/III", "status": "Active, not recruiting", "target": 80, "enrolled": 80, "sites": ["S01", "S02", "S04", "S06", "S08"], "design": "Randomised, double-blind, placebo-controlled"},
        {"id": "T04", "title": "Guduchi Ghanavati in Post-viral Fatigue", "titleHi": "वायरल-पश्चात थकान में गुडूची घनवटी", "ayur": "Jwara-pashchat Daurbalya", "cond": "Post-viral fatigue", "f": "F-GUD", "phase": "Phase II", "status": "Completed", "target": 60, "enrolled": 60, "sites": ["S01", "S03", "S05"], "design": "Randomised, placebo-controlled"},
        {"id": "T05", "title": "Guduchi Ghanavati in Prediabetes", "titleHi": "प्रीडायबिटीज़ में गुडूची घनवटी", "ayur": "Prameha Purvarupa", "cond": "Prediabetes", "f": "F-GUD", "phase": "Phase III", "status": "Recruiting", "target": 100, "enrolled": 41, "sites": ["S01", "S02", "S04", "S07"], "design": "Randomised, double-blind, placebo-controlled"},
        {"id": "T06", "title": "Guduchi as Add-on in Rheumatoid Arthritis", "titleHi": "संधिवात (आमवात) में गुडूची सहायक चिकित्सा", "ayur": "Amavata", "cond": "Rheumatoid arthritis", "f": "F-GUD", "phase": "Phase II", "status": "EC approval pending", "target": 70, "enrolled": 0, "sites": ["S01", "S06", "S08"], "design": "Randomised, add-on to standard care"},
        {"id": "T07", "title": "Triphala Churna in Functional Constipation", "titleHi": "कार्यात्मक कब्ज (विबंध) में त्रिफला चूर्ण", "ayur": "Vibandha", "cond": "Functional constipation", "f": "F-TRI", "phase": "Phase III", "status": "Recruiting", "target": 110, "enrolled": 64, "sites": ["S01", "S02", "S03", "S04", "S05", "S07"], "design": "Randomised, double-blind, placebo-controlled"},
        {"id": "T08", "title": "Triphala Churna in Class-I Obesity", "titleHi": "स्थौल्य (मोटापा) में त्रिफला चूर्ण", "ayur": "Sthaulya", "cond": "Obesity class I", "f": "F-TRI", "phase": "Phase II", "status": "Recruiting", "target": 80, "enrolled": 18, "sites": ["S02", "S06", "S07"], "design": "Randomised, open-label, lifestyle-controlled"},
        {"id": "T09", "title": "Triphala Gandusha in Chronic Periodontitis", "titleHi": "दीर्घकालिक पीरियडोंटाइटिस में त्रिफला गण्डूष", "ayur": "Upakusha", "cond": "Chronic periodontitis", "f": "F-TRI", "phase": "Phase IV", "status": "Suspended", "target": 60, "enrolled": 24, "sites": ["S03", "S05", "S08"], "design": "Randomised, active-controlled (chlorhexidine)" },
        {"id": "T10", "title": "Kaishore Guggulu in Knee Osteoarthritis", "titleHi": "घुटने के ऑस्टियोआर्थराइटिस (संधिगत वात) में कैशोर गुग्गुलु", "ayur": "Sandhigata Vata", "cond": "Knee osteoarthritis", "f": "F-KSG", "phase": "Phase III", "status": "Recruiting", "target": 120, "enrolled": 60, "sites": ["S01", "S02", "S03", "S04", "S07"], "design": "Randomised, double-blind, active-controlled (glucosamine)"},
        {"id": "T11", "title": "Kaishore Guggulu in Gouty Arthritis", "titleHi": "वातरक्त (गठिया) में कैशोर गुग्गुलु", "ayur": "Vatarakta", "cond": "Gouty arthritis", "f": "F-KSG", "phase": "Phase II", "status": "Recruiting", "target": 70, "enrolled": 34, "sites": ["S01", "S05", "S06"], "design": "Randomised, open-label, standard-care controlled"},
        {"id": "T12", "title": "Kaishore Guggulu as Add-on in Plaque Psoriasis", "titleHi": "एककुष्ठ (सोरायसिस) में कैशोर गुग्गुलु सहायक चिकित्सा", "ayur": "Ekakushtha", "cond": "Plaque psoriasis", "f": "F-KSG", "phase": "Phase II", "status": "Recruiting", "target": 60, "enrolled": 30, "sites": ["S01", "S02", "S08"], "design": "Randomised, add-on to topical standard care"},
    ]

    studies = []
    participants = []
    
    for i, s_def in enumerate(studies_def):
        s_id = s_def["id"]
        study_sites = []
        per_site = s_def["target"] // len(s_def["sites"])
        for s_idx, site_id in enumerate(s_def["sites"]):
            study_sites.append({
                "siteId": site_id,
                "piName": "Dr. Meera Iyer" if (s_idx == 0 and s_id in ["T10", "T11"]) else f"Investigator {s_idx+1}",
                "target": per_site,
                "activatedOn": date_str(-180 + s_idx * 20),
            })
            
        studies.append({
            "id": s_id,
            "code": f"AIIA-{s_def['f'][2:]}-{s_id}",
            "title": s_def["title"],
            "titleHi": s_def["titleHi"],
            "ayurvedaCondition": s_def["ayur"],
            "condition": s_def["cond"],
            "formulationId": s_def["f"],
            "phase": s_def["phase"],
            "status": s_def["status"],
            "ctriNo": f"CTRI/2026/01/09{1100 + i*37}",
            "ctriLastUpdated": date_str(-30),
            "sponsor": "All India Institute of Ayurveda (synthetic)",
            "piName": study_sites[0]["piName"],
            "sites": study_sites,
            "target": s_def["target"],
            "startDate": date_str(-300),
            "plannedEndDate": date_str(200),
            "ecName": "IEC, AIIA New Delhi (synthetic)",
            "ecApprovalDate": date_str(-320),
            "ecExpiryDate": date_str(45 if s_id == "T02" else 180),
            "ecRenewalStatus": "Renewal due" if s_id == "T02" else "Approved",
            "design": s_def["design"],
            "enrolmentHistory": [
                {"month": "2026-05", "cumulative": s_def["enrolled"] // 3},
                {"month": "2026-06", "cumulative": (s_def["enrolled"] * 2) // 3},
                {"month": "2026-07", "cumulative": s_def["enrolled"]},
            ],
        })

        # Add participants
        for p_idx in range(s_def["enrolled"]):
            site_pick = study_sites[p_idx % len(study_sites)]["siteId"]
            p_id = f"{s_id}-{site_pick}-{str(p_idx+1).zfill(3)}"
            arm = "Intervention" if p_idx % 2 == 0 else "Control"
            b_id = "B-KSG-2606" if s_id in ["T10", "T12"] and arm == "Intervention" else ("B-ASH-2604" if s_def["f"] == "F-ASH" else "B-GUD-2603")
            participants.append({
                "id": p_id,
                "vaultToken": f"vlt_{s_id}_{p_idx:04x}",
                "studyId": s_id,
                "siteId": site_pick,
                "arm": arm,
                "sex": "F" if p_idx % 2 == 0 else "M",
                "age": 25 + (p_idx * 3) % 45,
                "enrolledOn": date_str(-120 + (p_idx % 90)),
                "status": "Enrolled",
                "batchId": b_id if arm == "Intervention" else None,
                "consentVersion": "v2.1",
                "consentStatus": "Granted" if p_idx % 15 != 0 else "Re-consent required",
                "consentPurposes": {"trial": True, "pvSharing": True, "futureResearch": p_idx % 2 == 0},
                "consentLanguage": "Hindi" if p_idx % 2 == 0 else "English",
                "consentedAt": dt_str(-125),
            })

    # 6 Synthetic SAEs anchored relative to now
    aes = [
        {
            "id": "AE-0001",
            "participantId": "T10-S01-001",
            "studyId": "T10",
            "siteId": "S01",
            "batchId": "B-KSG-2606",
            "verbatim": "Jaundice with ALT 8x ULN — admitted for evaluation",
            "namasteTerm": "Kamala (Pittaja)",
            "meddraPT": "Drug-induced liver injury",
            "meddraSOC": "Hepatobiliary disorders",
            "codingStatus": "Suggested",
            "severity": "Severe",
            "serious": True,
            "seriousCriteria": ["Hospitalisation"],
            "causality": "Probable",
            "outcome": "Recovering",
            "onsetAt": dt_str(hours_offset=-25.5),
            "awareAt": dt_str(hours_offset=-22.5),  # 22.5h ago -> near deadline
            "status": "Open",
            "narrative": "Participant on Kaishore Guggulu (batch KSG/26/06) presented with icterus, ALT 318 U/L.",
        },
        {
            "id": "AE-0002",
            "participantId": "T05-S01-003",
            "studyId": "T05",
            "siteId": "S01",
            "batchId": "B-GUD-2603",
            "verbatim": "Hypoglycaemic episode requiring admission",
            "namasteTerm": "Glani with Sweda",
            "meddraPT": "Hypoglycaemia",
            "meddraSOC": "Metabolism and nutrition disorders",
            "codingStatus": "Coded",
            "severity": "Severe",
            "serious": True,
            "seriousCriteria": ["Hospitalisation"],
            "causality": "Possible",
            "outcome": "Recovered",
            "onsetAt": dt_str(hours_offset=-22.0),
            "awareAt": dt_str(hours_offset=-20.0),  # 20.0h ago -> near deadline
            "status": "Open",
            "narrative": "Participant on Guduchi Ghanavati with concomitant metformin. Capillary glucose 48 mg/dL.",
        },
        {
            "id": "AE-0003",
            "participantId": "T03-S01-005",
            "studyId": "T03",
            "siteId": "S01",
            "batchId": "B-ASH-2604",
            "verbatim": "Fall at home with hip fracture",
            "meddraPT": "Hip fracture",
            "meddraSOC": "Injury, poisoning and procedural complications",
            "codingStatus": "Coded",
            "severity": "Severe",
            "serious": True,
            "seriousCriteria": ["Hospitalisation", "Disability"],
            "causality": "Unlikely",
            "outcome": "Not recovered",
            "onsetAt": dt_str(hours_offset=-30.0),
            "awareAt": dt_str(hours_offset=-27.0),  # 27.0h ago -> OVERDUE!
            "status": "Open",
            "narrative": "Elderly participant slipped in bathroom; unrelated to IP.",
        },
        {
            "id": "AE-0004",
            "participantId": "T12-S01-001",
            "studyId": "T12",
            "siteId": "S01",
            "batchId": "B-KSG-2606",
            "verbatim": "Liver enzymes >5x ULN, hospitalised",
            "meddraPT": "Hepatic enzyme increased",
            "meddraSOC": "Investigations",
            "codingStatus": "Coded",
            "severity": "Severe",
            "serious": True,
            "seriousCriteria": ["Hospitalisation"],
            "causality": "Possible",
            "outcome": "Recovering",
            "onsetAt": dt_str(days_offset=-7),
            "awareAt": dt_str(days_offset=-6),
            "reportedAt": dt_str(days_offset=-5, hours_offset=6),  # met on time
            "status": "Initial reported",
            "narrative": "Asymptomatic ALT rise to 226 U/L on Kaishore Guggulu KSG/26/06.",
        },
    ]

    # Additional cluster of hepatic AEs for KSG/26/06 to demonstrate signal detection
    for k in range(5, 18):
        aes.append({
            "id": f"AE-{str(k).zfill(4)}",
            "participantId": f"T10-S02-{str(k).zfill(3)}",
            "studyId": "T10",
            "siteId": "S02",
            "batchId": "B-KSG-2606",
            "verbatim": "Raised liver enzymes on W4 labs" if k % 2 == 0 else "Nausea with jaundice",
            "namasteTerm": "Kamala" if k % 2 != 0 else None,
            "meddraPT": "Hepatic enzyme increased" if k % 2 == 0 else "Jaundice",
            "meddraSOC": "Investigations" if k % 2 == 0 else "Hepatobiliary disorders",
            "codingStatus": "Coded",
            "severity": "Moderate",
            "serious": False,
            "causality": "Probable",
            "outcome": "Recovering",
            "onsetAt": dt_str(days_offset=-20 - k),
            "awareAt": dt_str(days_offset=-19 - k),
            "status": "Closed",
        })

    return {
        "anchor": now_iso,
        "users": users,
        "sites": sites,
        "formulations": formulations,
        "batches": batches,
        "studies": studies,
        "participants": participants,
        "aes": aes,
        "deviations": [],
        "visits": [],
    }
