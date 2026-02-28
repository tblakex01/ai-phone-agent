## 2025-12-15 - Secure Logger and CSP
**Vulnerability:** Medium severity logs were exposing full error objects which could potentially contain sensitive data (like API keys in headers/config). Also missing basic security headers.
**Learning:** Even client-side apps need careful logging because browser consoles and log aggregation tools can capture sensitive info. React apps need CSP via meta tags if headers are not controllable.
**Prevention:** Use a sanitized logger wrapper instead of raw console methods. Add CSP meta tags.

## 2025-02-18 - String Sanitization in Logger
**Vulnerability:** The logging utility sanitized object properties based on key names but failed to sanitize strings containing secrets (e.g. API keys in URLs or error messages) and values of non-sensitive keys.
**Learning:** Sensitive data can appear anywhere, not just in fields named "password" or "apiKey". Error messages and URLs are common leak sources.
**Prevention:** Implement pattern-based redaction (Regex) for known secret formats (like Google API keys) on ALL string values logged, not just sensitive keys.
