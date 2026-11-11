---
name: Admin-configured financial text
description: Keep customer-facing deposit and withdrawal amounts and terms synchronized with administrator settings.
---

Customer-facing text for deposit minimums, withdrawal minimums, fees, and schedules must use the saved platform settings. Re-fetch these settings when the relevant screen opens or regains focus; do not impose a UI-only minimum floor that differs from the configured value.

**Why:** The administrator changed these values, but cached settings and a hardcoded deposit floor left the customer-facing text unchanged.

**How to apply:** Use the shared minimum-setting defaults only when a setting is missing or invalid, validate deposits against the configured minimum on both client and server, and keep fixed quick-amount choices separate from that minimum.

During an audit, preserve saved financial values. If a financial rate or customer-facing term is fixed in code but should be configurable, expose it in the admin panel using its current effective value as the fallback; do not write or overwrite stored settings during the audit.

**Why:** The user asked that existing data remain unchanged and that settings become editable through the administrator panel.

**How to apply:** Read existing settings into new admin controls, retain current effective defaults when a key is absent, and only persist changes after the administrator explicitly saves the panel.
