---
name: Demo OTP registration
description: User preference for the registration OTP while no SMS provider is used
---

The user wants registration OTP to remain a demonstration during development: tapping OTP fills a changing code automatically, with no SMS sent. Do not add an SMS provider unless the user asks.

**Why:** The user explicitly chose to use the demonstration flow rather than real SMS delivery.

**How to apply:** Keep demo-code generation limited to development and require the generated code to match the current registration attempt. Do not treat a visible demo code as production phone verification.
