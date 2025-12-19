## 2025-12-15 - Secure Logger and CSP
**Vulnerability:** Medium severity logs were exposing full error objects which could potentially contain sensitive data (like API keys in headers/config). Also missing basic security headers.
**Learning:** Even client-side apps need careful logging because browser consoles and log aggregation tools can capture sensitive info. React apps need CSP via meta tags if headers are not controllable.
**Prevention:** Use a sanitized logger wrapper instead of raw console methods. Add CSP meta tags.

## 2025-12-19 - Input Length Limits (DoS Prevention)
**Vulnerability:** The `WelcomeScreen` configuration fields lacked input length limits, allowing users (or automated tools) to paste massive strings (e.g., >10MB) into fields like "System Instructions". This could cause browser freezes (client-side DoS) or potential issues if these large payloads were sent to the Gemini API.
**Learning:** Client-side input validation is the first line of defense. While React handles XSS well, it doesn't automatically limit input size. Explicit `maxLength` and logical truncation in handlers are necessary.
**Prevention:** Added `maxLength` attributes to inputs and implemented strict character limits in the state update handler to enforce boundaries (e.g., 2000 chars for system instructions).
