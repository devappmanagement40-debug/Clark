---
name: Workflow secret scope
description: Secret availability differs between ad hoc shell commands and managed app workflows
---

In this workspace, secret-presence metadata did not guarantee that a particular process received the value. Ad hoc and temporary workflows lacked an admin secret until it was re-saved through the secure secret flow; the guarded operation then succeeded in the existing managed workflow.

**Why:** Shell commands, temporary workflows, and the managed app can run with different injected environments; a secret key appearing in workspace metadata does not prove the current process received its value.

**How to apply:** Verify required values inside the exact process without logging them. If a required secret is unavailable, re-save it through the secure secret flow, then run a narrowly guarded helper through the existing managed workflow. Use only the explicitly configured external database, fail closed on a missing or ambiguous account match, restore the normal workflow, remove the helper, and never print secret values.