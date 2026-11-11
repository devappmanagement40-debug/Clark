---
name: Mockup sandbox dependencies
description: Dependency resolution in the standalone component-preview Vite workspace
---

The component-preview sandbox has an independent dependency tree. A package installed at the project root may not satisfy imports in the sandbox, and its CSS transform can fail even when the main app builds.

**Why:** The preview server resolves modules from its own workspace rather than the app's root dependencies.

**How to apply:** When a sandbox preview fails on a missing CSS or Tailwind package, inspect and install the dependency in the sandbox workspace itself, then restart its managed workflow.

The sandbox also runs on its own managed preview port. `Screenshot` with `appPreview` targets the main application workflow, so a `/__mockup/...` screenshot can show the main app's 404 page even when the sandbox preview works.

**Why:** The component-preview server is separate from the application's port 5000 workflow; a path-only screenshot is not automatically routed to the sandbox server.

**How to apply:** Verify sandbox previews through their own workflow/dev-domain route or local sandbox port. Do not treat a main-app 404 screenshot as a component failure.

When a prototype uses only its own CSS, loading the shared sandbox stylesheet can still block it if the isolated package versions are not installed or do not match the root workspace.

**Why:** The sandbox and root can declare different Tailwind major versions, while the shared stylesheet imports Tailwind during Vite's CSS transform.

**How to apply:** Prefer repairing dependencies in the sandbox workspace. For a self-contained prototype that does not use Tailwind utilities, scope the preview so it skips the shared stylesheet; do not edit the global stylesheet for a one-off mockup.