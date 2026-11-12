CREATE TABLE IF NOT EXISTS "wheel_reward_records" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "spin_credit_id" integer NOT NULL REFERENCES "wheel_spin_credits"("id"),
  "prize_name" text NOT NULL,
  "prize_value" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "wheel_reward_records_spin_credit_unique"
  ON "wheel_reward_records" ("spin_credit_id");

CREATE INDEX IF NOT EXISTS "wheel_reward_records_user_created_idx"
  ON "wheel_reward_records" ("user_id", "created_at");
