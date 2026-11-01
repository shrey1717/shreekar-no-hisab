-- Migration 006: Google Auth and Personal Ledger Tables

-- 1. Support Google OAuth in users table
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_idx
  ON users (google_id)
  WHERE google_id IS NOT NULL;

-- 2. Personal Expenses Table for individual daily/monthly expense tracking
CREATE TABLE IF NOT EXISTS personal_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  amount_minor BIGINT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  category VARCHAR(50) NOT NULL DEFAULT 'Other',
  expense_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT personal_expenses_amount_check CHECK (amount_minor > 0)
);

CREATE INDEX IF NOT EXISTS personal_expenses_user_date_idx
  ON personal_expenses (user_id, expense_date DESC);

CREATE INDEX IF NOT EXISTS personal_expenses_user_category_idx
  ON personal_expenses (user_id, category);

-- 3. Customer & Supplier Ledgers (Khata / Accounts)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  type VARCHAR(20) NOT NULL,
  phone VARCHAR(30),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT accounts_type_check CHECK (type IN ('customer', 'supplier'))
);

CREATE INDEX IF NOT EXISTS accounts_user_type_idx
  ON accounts (user_id, type);

CREATE TABLE IF NOT EXISTS account_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_minor BIGINT NOT NULL,
  direction VARCHAR(10) NOT NULL,
  entry_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT account_entries_amount_check CHECK (amount_minor > 0),
  CONSTRAINT account_entries_direction_check CHECK (direction IN ('gave', 'got'))
);

CREATE INDEX IF NOT EXISTS account_entries_account_date_idx
  ON account_entries (account_id, entry_date DESC);

CREATE INDEX IF NOT EXISTS account_entries_user_date_idx
  ON account_entries (user_id, entry_date DESC);
