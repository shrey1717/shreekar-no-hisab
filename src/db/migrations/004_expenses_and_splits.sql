CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id),
  created_by UUID NOT NULL REFERENCES users(id),
  payer_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(160) NOT NULL,
  amount_minor BIGINT NOT NULL,
  currency CHAR(3) NOT NULL,
  category VARCHAR(50),
  expense_date DATE NOT NULL,
  split_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT expenses_amount_check CHECK (amount_minor > 0),
  CONSTRAINT expenses_split_type_check
    CHECK (split_type IN ('equal', 'custom')),
  CONSTRAINT expenses_status_check
    CHECK (status IN ('active', 'voided'))
);

CREATE INDEX expenses_group_date_idx
  ON expenses (group_id, expense_date DESC);

CREATE INDEX expenses_group_status_idx
  ON expenses (group_id, status);

CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  share_minor BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT expense_splits_share_check CHECK (share_minor > 0),
  UNIQUE (expense_id, user_id)
);

CREATE INDEX expense_splits_user_id_idx ON expense_splits (user_id);
