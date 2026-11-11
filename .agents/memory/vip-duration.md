---
name: VIP duration
description: Business rule for the duration and total return of VIP products.
---

Product cycle lengths, prices, and earnings are managed in the admin panel. For the CATL VIP catalog, use 150 days and derive total return from daily earnings multiplied by cycle length. Apply new terms only to future purchases; preserve previous offer records and their terms for existing holders, and retire old offers from new sales.

**Why:** The user chose the 150-day duration and daily amounts as authoritative because the supplied totals conflict, and explicitly chose not to change terms for existing purchases.

**How to apply:** Add a new catalog version once with a durable marker; deactivate old offers without editing or deleting their product rows, so active user purchases continue using their original terms. Do not reseed or overwrite admin edits on later starts.