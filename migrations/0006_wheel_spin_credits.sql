CREATE TABLE IF NOT EXISTS "wheel_spin_credits" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "source_user_product_id" integer NOT NULL REFERENCES "user_products"("id"),
  "source_type" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "wheel_spin_credits_user_purchase_unique"
  ON "wheel_spin_credits" ("user_id", "source_user_product_id");
