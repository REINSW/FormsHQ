-- ── TASKS ───────────────────────────────────────────────────
-- Run this in Supabase SQL Editor to add task management

CREATE TABLE IF NOT EXISTS tasks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id   UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  agency_id        UUID NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT DEFAULT 'admin',
  -- category values: verification | compliance | document | signing | admin
  status           TEXT DEFAULT 'pending',
  -- status values: pending | in_progress | completed | skipped
  priority         TEXT DEFAULT 'normal',
  -- priority values: low | normal | high | urgent
  due_date         DATE,
  notes            TEXT,
  is_auto_generated BOOLEAN DEFAULT false,
  completed_at     TIMESTAMPTZ,
  completed_by     UUID REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tasks_transaction_id_idx ON tasks(transaction_id);
CREATE INDEX IF NOT EXISTS tasks_agency_id_idx ON tasks(agency_id);
