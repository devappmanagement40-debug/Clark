import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Prefer the current Supabase variable while retaining compatibility with
// existing Plesk environments that still expose the legacy variable name.
const databaseUrl =
  process.env.SUPABASE_NEW_DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "SUPABASE_NEW_DATABASE_URL or SUPABASE_DATABASE_URL must be configured.",
  );
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
});
export const db = drizzle(pool, { schema });
