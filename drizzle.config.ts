import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.SUPABASE_NEW_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("SUPABASE_NEW_DATABASE_URL must be configured.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  schemaFilter: ["public"],
  tablesFilter: [
    "admin_audit_log",
    "clapay_payouts",
    "countries",
    "deposits",
    "gift_code_claims",
    "gift_codes",
    "payment_channels",
    "payment_numbers",
    "platform_settings",
    "products",
    "referral_commissions",
    "staking_products",
    "tasks",
    "transactions",
    "users",
    "user_products",
    "user_stakings",
    "user_tasks",
    "withdrawal_fee_payments",
    "withdrawals",
    "withdrawal_wallets",
  ],
  dbCredentials: {
    url: databaseUrl,
  },
});
