ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS users_phone_number_idx
  ON users (phone_number)
  WHERE phone_number IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_firebase_uid_idx
  ON users (firebase_uid)
  WHERE firebase_uid IS NOT NULL AND deleted_at IS NULL;
