---
name: Provider reference privacy
description: Customer-facing payment history and initiation responses must not expose provider transaction references.
---

Keep real provider transaction references, signatures, and payment tokens on the server for callbacks, verification, and authorized administrative review. Customer-facing transaction history and payment initiation responses should use the stable public transaction ID instead, and omit provider-specific reference fields from the response.

**Why:** The user requested that transaction references from Clapay and other providers not be shown to customers; exposing them can reveal internal provider identifiers and causes confusion with the platform's own transaction ID.

**How to apply:** Sanitize customer API responses and render the public transaction ID in customer histories. Preserve internal database values for provider status checks and admin tools; do not remove fields that the live payment flow needs unless an equivalent server-side path is provided.
