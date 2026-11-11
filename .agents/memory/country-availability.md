---
name: Country availability
description: Country availability and admin-managed deposit and withdrawal methods
---

When a country should disappear from signup or the public country selector, deactivate its catalog entry rather than deleting it outright.

**Why:** Country codes can remain attached to accounts and historical activity. Deletion destroys catalog context, while deactivation is reversible. Before hiding a country from login selection, check whether existing non-admin accounts use it; otherwise those users may no longer be able to select the country required for login.

**How to apply:** Check account counts and the login path before a country change. Preserve inactive entries for history, and ensure new registration accepts only active countries.

Public pickers may use the seeded country list only when `/api/countries` fails; a successful empty response must stay empty. Server-side active-country validation remains authoritative, so a display fallback does not make registration or payments available during an API outage.

**Why:** A Plesk API 500 hid every country option even though the client bundle and seeded country data were valid.

**How to apply:** Use the fallback only for failed requests, label it as temporary, and keep inactive-country enforcement on the server.

The user's current active country list is exactly Togo (TG), Côte d'Ivoire (CI), Burkina Faso (BF), Niger (NE), and Bénin (BJ). Keep other catalog rows inactive rather than deleting them. Bénin uses XOF and phone prefix 229; its deposit operators and withdrawal methods are MTN Bénin and Moov Africa Bénin.

**Why:** the user requested this exact country list on 2026-10-16 and existing country codes may still be needed for historical records.

**How to apply:** Keep each country's deposit operators and withdrawal methods editable in the admin panel, including per-method activation. Do not restore country-specific runtime overrides. When the active country set or method choices change, update the app's first-install defaults, legacy defaults, API-failure fallbacks, and existing external-database rows without overwriting unrelated methods.

The withdrawal page must keep the country from the user's profile; do not let the withdrawal form select a separate country. Deposit and withdrawal-account setup can use the active-country selector.

**Why:** the user chose to keep the profile country for withdrawals.

**How to apply:** Keep withdrawal currency and payout methods tied to the profile country, while limiting deposit and wallet-account country choices to active countries.

Bénin deposits use MTN and Moov, and the user has explicitly chosen both as withdrawal methods too. The manual transfer flow remains usable without a shortcut USSD code until an exact merchant command is confirmed. Niger withdrawals also include NITA TRANSFERT, alongside existing methods.

**Why:** the user explicitly requested MTN and Moov for Bénin withdrawals and Nita for Niger withdrawals; deposit and withdrawal settings remain separate even when labels overlap.

**How to apply:** Keep Bénin's MTN and Moov deposit operators separate from its withdrawal-method list and receiver coordinates. Require administrator-configured receiver numbers and names before allowing a manual deposit; show the receiver details and required transaction ID without a USSD shortcut until the exact merchant identifier and command format are confirmed.

Keep deposit provider routing and selectable operator lists configurable per country in the admin panel. Discover operators from provider APIs when available; preserve each country's existing effective selection until an administrator saves a new list. A saved empty list disables all operators for that provider and country. Manual operators remain managed through country methods and payment numbers; hosted providers without an operator list remain country-routed.

**Why:** the user wants to choose manual or automatic deposits and enable specific operators per country in the admin panel rather than changing source code.

**How to apply:** Filter both the displayed operator choices and server-side payment initiation using the saved provider/country selection. Keep provider secrets in Plesk. Do not invent operator codes for hosted checkouts that do not expose selectable operators.

For Togo manual TMoney/Togocel deposits, generate the USSD merchant identifier from the active number configured for that operator in the admin payment-number panel; do not hardcode it. Strip the Togo country prefix if the saved number includes it.

**Why:** the user expects changing the admin-configured TMoney number to update the USSD instructions shown on manual deposit pages.

**How to apply:** Use the selected active payment number as the source for the TMoney USSD code. Keep the shortcut limited to Togocel/TMoney in Togo and hide it for payment links.