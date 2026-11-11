---
name: Imported database setup
description: Fresh imported projects may have only Replit's session table before the checked-in application schema is applied.
---

For production data operations in this project, use only the external PostgreSQL configured for the app; never use Replit-managed PostgreSQL. Do not infer the provider from the environment variable name: the last live connection reported a `neondb_owner` role even though the configured key is named `SUPABASE_NEW_DATABASE_URL`.

When setting up an imported app that uses Drizzle and connect-pg-simple, preserve the existing `session` table and treat application tables as new, even if Drizzle presents an ambiguous rename prompt. On Supabase, use a `tablesFilter` allowlist that excludes `session`; `drizzle-kit push --verbose` still applies changes, and push may disable RLS on an existing table.

**Why:** The user explicitly said Replit is for development and the Replit database must never be used. The environment-variable name can also be stale relative to the actual database provider. Separately, Drizzle can misidentify a pre-existing session table as a rename candidate; a prior verbose push applied DDL and disabled RLS on `countries`. The app's verified server database role bypasses RLS, so RLS can remain enabled without public API policies.

**How to apply:** For audits or authorized updates, connect only through `SUPABASE_NEW_DATABASE_URL`, never use Replit's SQL tool, and verify the live database identity before writing. For schema changes, inspect `information_schema` and RLS first, filter Drizzle changes to an explicit app-table allowlist, preserve `session`, and restore any RLS changes. Enable RLS on new public app tables and add no `anon` or `authenticated` policies unless direct client access is explicitly required; confirm the backend role bypasses RLS. Treat `--verbose` as SQL logging, not a dry run.