---
name: Withdrawal balance policy
description: Business rule for separating the total wallet balance from the amount eligible for withdrawal.
---

Keep three figures distinct. The deposit balance receives deposited principal and the signup bonus (500 XOF by default); it is never withdrawable and is reserved for purchases. The main “Solde” is the current earnings balance and is the only withdrawable amount, even when the user has not purchased a product. Referral commissions, product earnings, rewards, and other earnings credits go to this balance. “Revenus totaux” is cumulative received earnings, including referral commissions and other earnings credits; deposits, signup bonuses, and withdrawal refunds are excluded, and withdrawals or purchases do not reduce it. Product and staking purchases consume deposit funds first, then earnings if needed.

**Why:** The user specified that deposits are purchase-only, while referral bonuses and earnings belong in the withdrawable balance; total income is a cumulative record of received earnings.

**How to apply:** Put signup bonuses in deposit balance and record their transaction impact as a deposit credit. Credit daily product earnings, referral commissions, rewards, and other earnings to the earnings balance and add each new earnings credit to the lifetime total once. Do not count deposits, signup bonuses, or withdrawal refunds as lifetime income. Do not require a deposit or product purchase for a withdrawal; base withdrawal UI, availability checks, and server validation only on earnings. Keep purchase spending deposit-first and never include deposits or signup bonuses in a withdrawable total.

Do not reclassify pooled historical balances when adding persistent wallet fields. Keep the original combined total intact and derive the apparent split from the approved-deposit and purchase/staking ledgers until a separate reconciliation is approved.

**Why:** The persistent-wallet decision was made without approval to move historical funds; preserving the total avoids silently changing account value or withdrawability.

**How to apply:** For legacy accounts, calculate deposit principal remaining and treat the rest of the existing total as earnings. Do not backfill wallet columns from estimated historical splits.