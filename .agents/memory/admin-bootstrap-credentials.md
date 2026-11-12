---
name: Admin bootstrap credentials
description: Keep administrator account identifiers and PINs out of source defaults.
---

Never include a default administrator phone number, password, or PIN in source or seed code. Bootstrap an administrator only from explicitly configured values.

**Why:** A hardcoded default account can grant administrator access to the wrong registration.

**How to apply:** Keep administrator identifiers and credentials in the appropriate environment or per-account configuration, and never print or save their values in source, logs, or project memory.

Do not keep deployment-specific country defaults in source or Replit configuration. When creating a new bootstrap administrator, infer the country from an international phone number and the admin-managed country prefixes; skip creation if the prefix is missing or ambiguous.

**Why:** The user asked that this kind of environment-specific setting be removed from code and kept off the project configuration.

**How to apply:** Do not add a fixed country fallback. Use the configured country data at runtime and fail safely when it cannot identify exactly one country.
