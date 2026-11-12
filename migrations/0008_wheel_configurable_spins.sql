ALTER TABLE "wheel_spin_credits"
  ADD COLUMN IF NOT EXISTS "spin_number" integer NOT NULL DEFAULT 0;

DROP INDEX IF EXISTS "wheel_spin_credits_user_purchase_unique";

CREATE UNIQUE INDEX IF NOT EXISTS "wheel_spin_credits_user_purchase_unique"
  ON "wheel_spin_credits" ("user_id", "source_user_product_id", "spin_number");

ALTER TABLE "wheel_spin_credits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "wheel_reward_records" ENABLE ROW LEVEL SECURITY;
