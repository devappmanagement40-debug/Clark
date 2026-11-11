---
name: Deposit checkout routing
description: Client deposit checkout must not expose aggregator selection.
---

Do not ask clients to choose the payment aggregator on the deposit screen. After amount and country are set, use the RobotPay flow for operator/payment steps where supported; keep provider identifiers and names in the backend and administration.

**Why:** The user objected to exposing provider selection in the customer deposit flow. Guessing between multiple active methods could send a payment through the wrong provider.

**How to apply:** Automatically use the method when exactly one is configured for a country and navigate to RobotPay for supported providers. If multiple are active, do not choose one silently; require an explicit admin-side priority or resolve the configuration before allowing the deposit. Keep provider-specific external checkout redirects only where RobotPay does not support that provider.

For recipient-number payments, create the deposit as pending only after the client submits the payer number and transaction reference. The five-minute countdown is a tracking window; reaching zero must not approve, reject, credit, or expire the pending deposit.

**Why:** The user chose admin review for manual deposits and asked for the countdown screen shown in the reference; a timer must not imply provider confirmation or cancel a real pending request.

**How to apply:** Keep the status pending until an authorized review changes it. After the countdown, clearly say the request remains pending and allow the client to keep checking its status.

For Côte d’Ivoire only, append the selected XOF amount when opening the admin-configured Wave checkout link. Replace any previous `amount` value while preserving the merchant path and unrelated query parameters; keep the saved link unchanged and do not alter other countries or providers. Never bundle a merchant-specific Wave link or QR asset as a client fallback.

**Why:** The user chose to manage the Wave destination in the admin panel rather than ship account-related payment details in frontend source.

**How to apply:** Read the link from the country's admin-configured payment record. Build the click URL from that value and amount, gated by country `CI` and exact HTTPS host `pay.wave.com`; generate any QR from the configured link. If no link is configured, show the existing missing-link state instead of a hidden fallback. Keep recipient names and numbers in admin-managed payment records, never in seed code.

The 30-minute countdown shown on the Côte d’Ivoire Wave checkout is indicative only. Reaching zero must not block payment, close the page, or change deposit status.

**Why:** The user approved the countdown as a visual match to the mockup, but the configured Wave link has no corresponding expiry behavior.

**How to apply:** Keep this display timer separate from payment validity and deposit review; only enforce expiry if Wave later provides a real expiration signal.

When building new country-specific deposit pages from supplied mockups, add them alongside existing deposit pages; do not replace or remove the existing pages unless the user explicitly asks.

**Why:** The user clarified that new deposit pages are a new addition and the existing deposit pages must remain.

**How to apply:** Preserve current deposit routes and screens while implementing the new country-specific flows. Verify that old pages still exist after each change.

The initial deposit screen follows the supplied mockup's organization, but its selectable items are countries rather than payment providers. Choosing a country and continuing enters the existing deposit checkout flow.

**Why:** The user corrected the design direction: match the deposit mockup while keeping countries as the customer choice and provider routing internal.

**How to apply:** Keep the user-facing country selector and existing next-step logic; never render provider choices such as MAYA/GCASH on the initial screen.