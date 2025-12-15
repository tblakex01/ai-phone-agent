## 2025-12-15 - Secure Logger and CSP
**Vulnerability:** Medium severity logs were exposing full error objects which could potentially contain sensitive data (like API keys in headers/config). Also missing basic security headers.
**Learning:** Even client-side apps need careful logging because browser consoles and log aggregation tools can capture sensitive info. React apps need CSP via meta tags if headers are not controllable.
**Prevention:** Use a sanitized logger wrapper instead of raw console methods. Add CSP meta tags.
