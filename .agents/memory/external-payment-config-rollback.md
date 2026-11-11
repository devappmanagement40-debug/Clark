---
name: External payment configuration rollback
description: Preserve external provider configuration and keep secrets in Plesk environment variables.
---

Restoring payment source files to a GitHub snapshot does not revert country/operator settings previously written to the app's external database by a seed migration. Confirm the target database before changing persisted configuration; preserve payment-number records and transaction history unless the user explicitly requests otherwise.

**Why:** A source rollback restored the repository state while the app API continued returning a previously migrated country method from Supabase. Resetting that setting would affect which deposit options users can access.

**How to apply:** After restoring payment code, compare the live API configuration with the chosen repository snapshot. If external data differs, explain the impact and get confirmation before changing the database.

For deposit routing, derive the editor's first view from legacy settings without persisting it. Only an administrator's explicit save should switch to the new per-country map. Provider API URLs, merchant identifiers, API keys, and webhook secrets belong in Plesk environment variables, not admin settings or database rows. Startup seeding and migrations must not assign countries or overwrite existing provider routing.

**Why:** The requested routing must be configurable by country while preserving current behavior until an administrator saves, and application startup must not silently change an external production database.

**How to apply:** Keep compatibility reads in memory; validate and persist the routing map only through the admin save endpoint. Never run a production migration or seed to initialize provider routing without explicit authorization.