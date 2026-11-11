-- Add persistent wallet buckets without changing existing account totals.
-- Existing rows remain in users.balance and are split read-only by the app.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "deposit_balance" numeric(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "earnings_balance" numeric(15, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "wallet_activated_at" timestamp;

-- NULL means the transaction predates persistent wallet allocation.
ALTER TABLE "transactions"
  ADD COLUMN IF NOT EXISTS "wallet_impact" text;
