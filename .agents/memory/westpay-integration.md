---
name: WestPay Integration
description: WestPay hosted deposit flow, country routing, webhook behavior, and the user's deposits-only scope.
---

## Architecture

**Deposit flow (redirect-based):**
1. User selects WestPay channel → "westpay" step in deposit.tsx
2. POST /api/deposits with `{ useWestpay: true }` → server creates deposit (status: "pending"), builds redirect URL
3. Frontend redirects to `https://payment.bank2.westpay.cfd/?merchant=SLUG&amount=X&country=NAME&redirect=CALLBACK`
4. WestPay redirects back to GET /api/westpay/callback?depositId=X&status=success&ref=OP-xxx
5. Server stores westpayReference = ref, redirects to /deposit?wp_status=success
6. Webhook POST /api/webhooks/westpay (X-RobotPay-Signature HMAC-SHA256) confirms → approve deposit

**Withdrawal scope:**
- The user chose WestPay deposits only and declined automatic WestPay payouts on 2026-11-17.
- Do not enable or wire WestPay payouts unless the user changes this scope.
- A transfer helper/API-key map may exist in source, but it is not an active payout integration.

## Deposit environment variables (server only, never in code/DB)
- WESTPAY_API_BASE_URL — merchant API base URL
- WESTPAY_CHECKOUT_BASE_URL — hosted checkout base URL
- WESTPAY_MERCHANT_SLUG — merchant slug for payment URL
- WESTPAY_WEBHOOK_SECRET — webhook HMAC secret

## Settings keys (in platformSettings DB table)
- westpayEnabled: "true"/"false"
- westpayChannelName: display name (default "WestPay")
- westpayCountries: comma-separated codes, empty = all countries

## Key files
- server/westpay.ts — checkout URL, webhook signature verification, and unused transfer helper
- server/routes.ts — /api/westpay/callback (GET) + /api/webhooks/westpay (POST) + deposit handler
- shared/schema.ts — deposits.westpayReference column
- server/storage.ts — getDepositByWestpayReference()
- client/src/pages/deposit.tsx — "westpay" step, wpInitiateMutation, wp_status handling
- client/src/components/admin/settings.tsx — WestPay card with toggle, countries, webhook secret

**Why:**
WestPay uses X-RobotPay-Signature (not x-westpay-signature) in webhook headers.
The webhook signature is HMAC-SHA256 of the raw JSON body (not stringified twice).
The webhook secret is single/global. On 2026-11-17, the user explicitly chose WestPay deposits only, not automatic payouts.

**How to apply:**
Keep the provider toggle and country routing limited to deposits. Do not treat per-country payout keys or the transfer helper as an enabled payout feature.
