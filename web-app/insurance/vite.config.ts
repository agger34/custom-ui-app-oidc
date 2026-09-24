import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This app is one of two OIDC test clients that share the login UI in
// ../../ (custom-UI-app-oidc). It must be reached via its /etc/hosts domain,
// not "localhost" - see that project's README "allowedHosts" note for why.
const ALLOWED_HOSTS = ['insurance.xbank.test'];

// Local HTTPS via mkcert (see ../README.md Phần 3.2 "Bắt buộc: HTTPS local cho web-app (mkcert)").
// REQUIRED here (unlike the login UI): PKCE's code_challenge needs
// `crypto.subtle`, which browsers only expose in a secure context
// (https://, or literal "localhost"/"127.0.0.1" - a custom domain over plain
// HTTP does not qualify even if it resolves to 127.0.0.1). Real HTTPS avoids
// the flaky chrome://flags/#unsafely-treat-insecure-origin-as-secure route.
const httpsOptions = {
  key: readFileSync('../../certs/xbank-test-key.pem'),
  cert: readFileSync('../../certs/xbank-test.pem'),
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,
    allowedHosts: ALLOWED_HOSTS,
    https: httpsOptions,
  },
  preview: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,
    allowedHosts: ALLOWED_HOSTS,
    https: httpsOptions,
  },
});
