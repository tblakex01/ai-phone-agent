## 2024-05-22 - Non-standard Secret Injection
**Vulnerability:** The project used `vite.config.ts`'s `define` property to manually inject `process.env.API_KEY` and `process.env.GEMINI_API_KEY` from the build environment into the client bundle.
**Learning:** This pattern obscures the fact that secrets are being exposed to the client and mimics Node.js server-side environment variables (`process.env`), which can confuse developers about the security context of the variable.
**Prevention:** Use Vite's standard `import.meta.env` with `envPrefix` (e.g., `VITE_` or `GEMINI_`) to explicitly opt-in environment variables for client-side exposure. This makes the exposure intentional and obvious.
