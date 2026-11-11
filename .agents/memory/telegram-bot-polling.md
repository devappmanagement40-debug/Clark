---
name: Telegram bot polling
description: Avoid competing getUpdates pollers when development and production share one Telegram bot token.
---

Only one server should poll Telegram `getUpdates` for a bot token at a time. Keep polling and scheduled Telegram summaries in the production process when development and Plesk production share credentials.

**Why:** Telegram terminates or conflicts concurrent long-poll requests for the same bot token, making command delivery unreliable.

**How to apply:** If Replit development and Plesk production use the same token, keep the Replit process from polling; continue to gate outbound payment notifications separately according to the environment's needs.