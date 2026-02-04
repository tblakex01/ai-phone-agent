## 2025-12-15 - Secure Logger and CSP
**Vulnerability:** Medium severity logs were exposing full error objects which could potentially contain sensitive data (like API keys in headers/config). Also missing basic security headers.
**Learning:** Even client-side apps need careful logging because browser consoles and log aggregation tools can capture sensitive info. React apps need CSP via meta tags if headers are not controllable.
**Prevention:** Use a sanitized logger wrapper instead of raw console methods. Add CSP meta tags.

## 2026-02-04 - Input Validation Gap in React Forms
**Vulnerability:** Uncontrolled input length in `WelcomeScreen` allowed users to enter arbitrarily large strings, potentially causing DoS or performance issues when sent to the backend.
**Learning:** React controlled components do not automatically limit input length. Visual cues (character counters) are essential for UX when enforcing security limits.
**Prevention:** Always define and enforce `maxLength` on text inputs and validate length in state updaters.
