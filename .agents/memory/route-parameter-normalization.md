---
name: Route parameter normalization
description: Normalize Express route params consistently before parsing IDs or using country, action, and path values.
---

With the current Express typings, `req.params` values may be typed as `string | string[]`. Use the shared route-param normalizer to select a single string before numeric parsing, decoding, or passing a value to string-only helpers.

**Why:** Direct parsing produced widespread TypeScript errors and could also mishandle an array value at runtime.

**How to apply:** Normalize route params first, then validate parsed IDs and country codes at the route boundary. Avoid `String(req.params.x)` as a shortcut because arrays can become comma-joined strings.
