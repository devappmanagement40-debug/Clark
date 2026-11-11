ALTER TABLE "deposits"
  ADD COLUMN IF NOT EXISTS "withdrawal_fee_payment_id" integer;

CREATE TABLE IF NOT EXISTS "withdrawal_fee_payments" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "withdrawal_amount" integer NOT NULL,
  "required_amount" integer NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "deposit_id" integer,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "paid_at" timestamp,
  "used_at" timestamp
);

CREATE INDEX IF NOT EXISTS "withdrawal_fee_payments_user_status_idx"
  ON "withdrawal_fee_payments" ("user_id", "status");