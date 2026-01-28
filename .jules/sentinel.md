## 2025-12-15 - Secure Logger and CSP
**Vulnerability:** Medium severity logs were exposing full error objects which could potentially contain sensitive data (like API keys in headers/config). Also missing basic security headers.
**Learning:** Even client-side apps need careful logging because browser consoles and log aggregation tools can capture sensitive info. React apps need CSP via meta tags if headers are not controllable.
**Prevention:** Use a sanitized logger wrapper instead of raw console methods. Add CSP meta tags.

## 2026-01-28 - Unbounded User Inputs
**Vulnerability:** The application accepted unlimited length strings for Name, Greeting, and System Instructions, posing a Denial of Service (DoS) risk.
**Learning:** Frontend-only validation is not enough for security, but it is a necessary first line of defense for UX and basic DoS prevention. Client-side state management can be overwhelmed by massive strings.
**Prevention:** Enforce strict character limits on all user input fields using `maxLength` and validated constants.
