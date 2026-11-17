ALTER TABLE "deposits"
  ADD COLUMN IF NOT EXISTS "westpay_reference" text;
