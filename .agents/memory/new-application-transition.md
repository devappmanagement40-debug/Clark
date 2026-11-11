---
name: New application transition
description: The user is replacing the old application and its application data with a new app.
---

The user is creating a new application rather than continuing the old app's data. Do not assume old user, transaction, or configuration records should be restored.

**Why:** The user explicitly requested clearing the connected Supabase application's tables and records as part of starting a new application.

**How to apply:** Treat future database setup as a fresh application transition. Preserve Supabase-managed internal schemas, and confirm the exact target before any additional destructive change.
