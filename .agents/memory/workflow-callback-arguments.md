---
name: Workflow callback arguments
description: Runtime argument shape for Replit workflow callbacks in CodeExecution
---

In CodeExecution, `removeWorkflow` accepts an object such as `{ name: "..." }`, despite the workflows skill example showing a bare string. When callback validation rejects a documented example, follow the runtime validator rather than retrying the same shape.

**Why:** The runtime rejected the bare-string call and succeeded with the object argument.

**How to apply:** Use the object argument when removing temporary or obsolete workflows, then verify the workflow is gone.