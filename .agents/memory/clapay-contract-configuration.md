---
name: Clapay contract configuration
description: Why Clapay's API contract is configured in Plesk rather than guessed in application code.
---

Clapay's base URL, authentication header format, initiation path and request fields, response paths, operator response shape, and terminal status values must follow the merchant's current Clapay documentation. Keep credentials and contract settings in Plesk environment variables rather than application settings or the database. Do not treat browser returns or callbacks as proof of payment; confirm status with Clapay's authenticated status endpoint and use the existing idempotent deposit approval gate before crediting funds.

For initiation requests in every country routed to Clapay, send only the local subscriber number, without the country calling code; in Niger this is the 8 local digits. Keep the international number for the UI and stored deposit record, and strip the selected country's configured prefix only when filling Clapay's outgoing phone placeholders.

If an initiation request times out or returns an ambiguous response, preserve the deposit as processing and retain its merchant transaction reference so a signed callback can reconcile it. Do not mark it rejected unless Clapay definitively refused the request. When operator metadata marks `otpstarter.MERCHANT` true, collect the operator OTP only for the deposit flow and send it as `operator_otp`; never persist or log the OTP. Clapay payouts do not require an operator OTP, even when the shared operator metadata marks one required for deposits; never ask for or send `operator_otp` on payout requests.

Keep a provider-generated customer confirmation code distinct from Clapay's merchant `signature`, which is used for payment status verification. For NITA deposits in Niger, parse Clapay's documented `payment_otp` as the payment-verification code, not as the request-side `operator_otp`. Prefer explicitly named response fields or a Plesk-configured JSON path. For NITA deposits in Niger only, allow a generic `reference`/`ref` fallback when its value differs from both the merchant signature and our outgoing order reference. Show the code only to the authenticated payer; do not persist or log it.

**Why:** For NITA deposits, the hosted payment page labels the customer confirmation value as a reference, and Clapay's official Swagger response schema includes `payment_otp`. Generic reference fields are ambiguous, so the fallback must stay NITA-specific and must not surface the transaction signature or merchant order reference.

**How to apply:** Preserve the existing signature/reference for status checks. Parse `payment_otp` only in the Niger NITA flow, never as `operator_otp`. Use `CLAPAY_INITIATE_CONFIRMATION_CODE_PATH` for other provider response paths; keep the generic reference fallback limited to NITA in Niger and exclude both merchant values.

**Why:** A live initiation was rejected with an invalid-phone response. The user clarified that Clapay requires only the local number in every country routed to it; removing `+` alone is insufficient. Other providers may require international formatting.

**How to apply:** At the Clapay server boundary, remove the configured calling code from an explicitly international number before filling phone placeholders; for BF and NE payouts, also recognize the full 11-digit international number when the user omitted `+`/`00`, while leaving 8-digit local numbers unchanged. Keep the displayed prefix and stored account number unchanged, and do not alter other providers' payloads. Check available documentation before changing other contract details. Keep status lookup server-side, preserve per-country routing, and make retries safe when the provider may already have accepted a request.

**Why:** The operator's OTP metadata describes the Clapay deposit flow, not payouts. Reusing it for payout validation incorrectly blocks payouts for operators that require OTP only when depositing.

**How to apply:** Keep deposit OTP handling separate from the payout options, form, server validation, and payout request body.

For Burkina Faso payouts only, accept prefix `46` for Orange Money (`codeoperator: OM`) even if Clapay's live `startwith` metadata omits it. Do not apply this exception to deposit validation or other operators.

**Why:** The merchant confirmed `46` as an Orange BF payout number, while the live operator metadata did not include it and otherwise rejected the payout before contacting Clapay.

**How to apply:** Keep the override scoped to BF Orange payout options and their server-side prefix check. Preserve Clapay's metadata for deposits and keep other BF operator checks unchanged.

For deposit discovery, use Clapay's live operator API as the source of available operators. Keep the explicit country assignment and global enable setting as safety gates; Plesk credentials alone must not expose Clapay in an unassigned country. Discovery must not initiate a payment or alter payout behavior.

**Why:** The user clarified that deposit methods must come from Clapay's API; a local empty-method result previously stopped the flow before the operator API was queried.

**How to apply:** When Clapay is enabled and assigned to a country, query its live operators before returning Clapay as an available deposit method. Distinguish an API failure from a valid empty operator list.