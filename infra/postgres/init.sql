-- TrialSetu PostgreSQL Database Initialisation (SIH26046)
-- Enforces cryptographic append-only integrity at database storage engine level

CREATE TABLE IF NOT EXISTS audit_log (
    seq SERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    detail TEXT NOT NULL,
    reason TEXT,
    prev_hash CHAR(64) NOT NULL,
    hash CHAR(64) NOT NULL UNIQUE
);

-- Cryptographic Append-Only Rule / Trigger:
-- Any UPDATE or DELETE statement is strictly rejected with a database exception.
CREATE OR REPLACE FUNCTION prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'CRITICAL COMPLIANCE BREACH: audit_log table is append-only. UPDATE and DELETE operations are prohibited under 21 CFR Part 11 and NDCT Rules 2019.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_tamper ON audit_log;
CREATE TRIGGER trg_prevent_audit_tamper
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();

-- Formulations and Batches Table
CREATE TABLE IF NOT EXISTS formulations (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_hi VARCHAR(255),
    dosage_form VARCHAR(128),
    ingredients TEXT,
    reference TEXT
);

CREATE TABLE IF NOT EXISTS batches (
    id VARCHAR(32) PRIMARY KEY,
    formulation_id VARCHAR(32) REFERENCES formulations(id),
    batch_no VARCHAR(64) NOT NULL,
    manufacturer VARCHAR(255),
    mfg_date DATE,
    expiry_date DATE,
    qc_status VARCHAR(32) DEFAULT 'Released',
    heavy_metals_pass BOOLEAN DEFAULT TRUE,
    microbial_pass BOOLEAN DEFAULT TRUE,
    units_dispensed INT DEFAULT 0
);

-- Studies Table
CREATE TABLE IF NOT EXISTS studies (
    id VARCHAR(16) PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    title TEXT NOT NULL,
    title_hi TEXT,
    ayurveda_condition VARCHAR(128),
    condition VARCHAR(128),
    formulation_id VARCHAR(32) REFERENCES formulations(id),
    phase VARCHAR(32),
    status VARCHAR(64),
    ctri_no VARCHAR(64),
    target INT NOT NULL,
    pi_name VARCHAR(128),
    ec_expiry_date DATE
);
