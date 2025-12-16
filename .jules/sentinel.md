## 2024-05-23 - Client-Side API Key Exposure
**Vulnerability:** API Key embedded in client-side code
**Learning:** `vite.config.ts` uses `define` to replace `process.env.API_KEY` with the actual key string. This exposes the key to anyone with access to the client bundle.
**Prevention:** For high-security apps, use a backend proxy to handle API requests and keep keys server-side.
