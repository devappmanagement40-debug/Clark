---
name: Admin bootstrap credentials
description: Keep administrator account identifiers and PINs out of source defaults.
---

Never include a default administrator phone number, password, or PIN in source or seed code. Bootstrap an administrator only from explicitly configured values.

**Why:** A hardcoded default account can grant administrator access to the wrong registration.

**How to apply:** Keep administrator identifiers and credentials in the appropriate environment or per-account configuration, and never print or save their values in source, logs, or project memory.
