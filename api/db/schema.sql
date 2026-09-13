-- ============================================================
-- REI Forms NSW — Prototype Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── AGENCIES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agencies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  trading_as      TEXT,
  licence_no      TEXT,
  abn             TEXT,
  address         TEXT,
  suburb          TEXT,
  state           TEXT DEFAULT 'NSW',
  postcode        TEXT,
  phone_work      TEXT,
  phone_mobile    TEXT,
  email           TEXT,
  -- Trust account defaults
  trust_account_name  TEXT,
  trust_bsb           TEXT,
  trust_account_no    TEXT,
  -- Fee defaults (pre-fill into wizard)
  default_management_fee_pct  NUMERIC(5,2),
  default_letting_fee         TEXT,
  default_admin_fee           NUMERIC(10,2),
  default_repairs_limit       NUMERIC(10,2) DEFAULT 500,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── USERS (agents) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id       UUID REFERENCES agencies(id),
  email           TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  role            TEXT DEFAULT 'agent' CHECK (role IN ('admin','agent','assistant')),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── PARTIES (owners / principals) ───────────────────────────
CREATE TABLE IF NOT EXISTS parties (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id       UUID REFERENCES agencies(id),
  -- Identity
  full_name       TEXT,
  first_name      TEXT,
  last_name       TEXT,
  company_name    TEXT,
  abn             TEXT,
  acn             TEXT,
  is_gst_registered BOOLEAN DEFAULT FALSE,
  -- Contact
  address         TEXT,
  suburb          TEXT,
  state           TEXT,
  postcode        TEXT,
  phone_work      TEXT,
  phone_home      TEXT,
  phone_mobile    TEXT,
  email           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── PROPERTIES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id       UUID REFERENCES agencies(id),
  -- Address
  street_address  TEXT,
  suburb          TEXT,
  state           TEXT DEFAULT 'NSW',
  postcode        TEXT,
  -- Attributes
  is_furnished    BOOLEAN DEFAULT FALSE,
  has_garage      BOOLEAN DEFAULT FALSE,
  is_strata       BOOLEAN DEFAULT FALSE,
  strata_plan_no  TEXT,
  strata_lot_no   TEXT,
  -- Water
  has_water_efficiency BOOLEAN,
  -- Pool
  has_pool        BOOLEAN DEFAULT FALSE,
  pool_registered BOOLEAN,
  pool_cert_valid BOOLEAN,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── INTAKE REQUESTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS intake_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id       UUID REFERENCES agencies(id),
  created_by      UUID REFERENCES users(id),
  intake_type     TEXT DEFAULT 'residential_pm' CHECK (intake_type IN ('residential_pm','sales','commercial_pm','rural')),
  -- Token for client link
  token           TEXT UNIQUE NOT NULL,
  token_expires_at TIMESTAMPTZ,
  -- Status
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','submitted','expired','cancelled')),
  -- Client contact (pre-fill from agent)
  client_name     TEXT,
  client_email    TEXT,
  client_mobile   TEXT,
  property_address TEXT,
  -- Form.io submission reference
  formio_submission_id TEXT,
  -- Raw responses from intake form
  responses       JSONB,
  submitted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── TRANSACTIONS (MA / SA / lease etc) ──────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id       UUID REFERENCES agencies(id),
  created_by      UUID REFERENCES users(id),
  intake_id       UUID REFERENCES intake_requests(id),
  -- Classification
  form_id         TEXT NOT NULL DEFAULT 'FM00100',
  form_name       TEXT DEFAULT 'Exclusive Management Agency Agreement (Residential)',
  transaction_type TEXT DEFAULT 'management_authority',
  -- Linked records
  party_id        UUID REFERENCES parties(id),
  property_id     UUID REFERENCES properties(id),
  -- Status
  status          TEXT DEFAULT 'draft' CHECK (status IN ('draft','in_progress','completed','cancelled')),
  -- Form.io wizard reference
  formio_submission_id TEXT,
  prefill_token   TEXT UNIQUE,
  prefill_token_expires_at TIMESTAMPTZ,
  -- Completed form data (canonical)
  form_data       JSONB,
  -- PDF
  pdf_path        TEXT,
  pdf_generated_at TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── FORM DEFINITIONS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS form_definitions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id         TEXT UNIQUE NOT NULL,
  form_name       TEXT NOT NULL,
  form_category   TEXT,
  formio_path     TEXT,
  formio_form_id  TEXT,
  intake_type     TEXT,
  is_intake_form  BOOLEAN DEFAULT FALSE,
  is_wizard       BOOLEAN DEFAULT FALSE,
  requires_signing BOOLEAN DEFAULT TRUE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── SEED: Agency ────────────────────────────────────────────
INSERT INTO agencies (id, name, trading_as, licence_no, abn, address, suburb, state, postcode, phone_work, email,
  trust_account_name, trust_bsb, trust_account_no,
  default_management_fee_pct, default_letting_fee, default_admin_fee, default_repairs_limit)
VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'Demo Property Management Pty Ltd',
  'Demo PM',
  '1234567',
  '12 345 678 901',
  '1 George Street',
  'Sydney', 'NSW', '2000',
  '02 9000 0000',
  'admin@demopm.com.au',
  'Demo PM Trust Account',
  '062-000',
  '12345678',
  8.80,
  '1 weeks rent + GST',
  15.00,
  500.00
) ON CONFLICT DO NOTHING;

-- ── SEED: Agent user (password: demo1234) ───────────────────
-- bcrypt hash of "demo1234"
INSERT INTO users (id, agency_id, email, password_hash, full_name, role)
VALUES (
  'b1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'agent@demopm.com.au',
  '$2b$10$rKqJzFfKkHjPxZ3vY5mXOuEfwNlT8cQmG1sD2aHiOjPkVbLnMeWuC',
  'Sarah Chen',
  'agent'
) ON CONFLICT DO NOTHING;

-- ── SEED: Form definitions ───────────────────────────────────
INSERT INTO form_definitions (form_id, form_name, form_category, formio_path, intake_type, is_intake_form, is_wizard, requires_signing)
VALUES
  ('INTAKE-RESIDENTIAL-PM', 'Residential PM Intake', 'intake', 'intake/residential-pm', 'residential_pm', TRUE, FALSE, FALSE),
  ('FM00100', 'Exclusive Management Agency Agreement (Residential)', 'ma_residential', 'wizard/fm00100', 'residential_pm', FALSE, TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- ── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_intake_requests_token ON intake_requests(token);
CREATE INDEX IF NOT EXISTS idx_intake_requests_agency ON intake_requests(agency_id);
CREATE INDEX IF NOT EXISTS idx_transactions_agency ON transactions(agency_id);
CREATE INDEX IF NOT EXISTS idx_transactions_intake ON transactions(intake_id);
CREATE INDEX IF NOT EXISTS idx_transactions_prefill_token ON transactions(prefill_token);
