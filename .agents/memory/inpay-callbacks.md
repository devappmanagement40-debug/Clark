---
name: InPay callback classification
description: Provider-specific rule for distinguishing InPay deposit and withdrawal callbacks safely.
---

InPay payin callbacks may include `order_number`, just like payout callbacks. The callback type must therefore be determined from the application-owned `out_trade_no` prefix (`PAYIN-` or `PAYOUT-`) before considering provider fields.

**Why:** Classifying every callback with `order_number` would route successful deposits into payout handling and prevent the user balance from being credited.

**How to apply:** Keep the merchant reference prefix stable and use it as the primary discriminator in webhook handlers; treat provider status/type fields only as secondary signals.

The provider documentation confirms form-urlencoded callbacks, lowercase `success` acknowledgements, and MD5 signatures over non-empty parameters sorted lexicographically by ASCII name, excluding `sign`, followed by `&key=<api key>`. Pay-in and payout callback statuses are `payin_ing/success/fail` and `payout_ing/success/fail`. Payout reversal notifications may contain only `out_trade_no` and `sign`; the separate secondary-validation request is JSON with `out_trade_no`, `timestamp`, and `sign`, and expects a JSON `status` response.

**Why:** These provider requirements are not recoverable from the application code and affect callback compatibility and final transaction handling.

The detailed pay-in unified-order specification uses `out_trade_no` and requires numeric `method`; `otp` is optional in the schema but needed for Orange in most countries. It also documents a two-minute validity window for Wave recharge links. The provider's earlier translated parameter summary called the merchant order reference `de_no`, so prefer the detailed endpoint schema and confirm if that older version is still in use.

Orange OTP verification is documented at `/inpays/payin/verifyotp` with required `merchantid`, `out_trade_no`, `timestamp`, `otp`, and `sign`. The excerpt does not establish whether this is called after unified-order creation or replaces the optional `otp` field there.

**Why:** Omitting the required operator method prevents a complete pay-in request even when the signature is valid; assuming the Orange OTP sequence could send verification at the wrong stage.

**How to apply:** Preserve the exact signing rules and acknowledgement text. Verify signatures for each configured merchant when callbacks omit `merchantid`; implement reversal and secondary-validation handling only against the provider's documented semantics. Send the selected operator's numeric `method` in pay-in requests, and confirm the Orange OTP sequence before wiring its user flow.