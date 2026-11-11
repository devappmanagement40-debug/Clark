---
name: Dev workflow port conflict
description: Repeated EADDRINUSE after restarting the development workflow
---

After a workflow restart, a previous server child has sometimes continued listening on port 5000 while the new workflow fails with EADDRINUSE. The preview may still answer requests through that older process even though the workflow is marked failed.

**Why:** Retrying the workflow without examining the listener can repeat the collision and leave the preview attached to a stale server.

**How to apply:** When a restart fails with EADDRINUSE, inspect the listener on port 5000 and verify it is this project's server before stopping that specific orphan. Then restart the existing workflow once and check its logs. Do not create a second workflow.