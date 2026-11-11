CREATE TABLE IF NOT EXISTS "clapay_payouts" (
  "id" serial PRIMARY KEY,
  "idempotency_key" text NOT NULL UNIQUE,
  "transaction_id" text NOT NULL UNIQUE,
  "admin_id" integer NOT NULL REFERENCES "users"("id"),
  "country" text NOT NULL,
  "amount" integer NOT NULL,
  "recipient_name" text NOT NULL,
  "recipient_phone" text NOT NULL,
  "operator_code" text NOT NULL,
  "operator_name" text NOT NULL,
  "signature" text,
  "status" text NOT NULL DEFAULT 'initiating',
  "provider_status" text,
  "message" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "processed_at" timestamp
);

CREATE INDEX IF NOT EXISTS "clapay_payouts_created_at_idx"
  ON "clapay_payouts" ("created_at" DESC);

CREATE UNIQUE INDEX IF NOT EXISTS "clapay_payouts_open_target_uq"
  ON "clapay_payouts" ("country", "recipient_phone", "amount", "operator_code")
  WHERE "status" IN ('initiating', 'processing');