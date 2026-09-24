import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// AM's Custom Login URL Template and the AM server must share the same top-level
// domain (cookie constraint) - see README "Domain & cookie requirements".
// Adjust host/port to match the value you put in the Custom Login URL Template.
//
// Vite 5's dev/preview server rejects any Host header it doesn't recognize
// (DNS rebinding protection), so a custom /etc/hosts domain like
// "login.xbank.test" must be explicitly allow-listed here, or requests fail
// with "Blocked request. This host ... is not allowed."
const ALLOWED_HOSTS = ['login.xbank.test'];

// Local HTTPS via mkcert (see README "Chạy HTTPS local với mkcert"). Not
// required for THIS app's own code to work (journey-client has no
// crypto.subtle/PKCE dependency), but kept consistent with the other two
// apps in web-app/ so the whole lab runs over the same scheme, and to avoid
// re-adding a mixed HTTP/HTTPS setup later. AM itself stays plain HTTP - see
// README "Vẫn HTTP ở AM" for the browser-side implication of that.
const httpsOptions = {
  key: readFileSync('./certs/xbank-test-key.pem'),
  cert: readFileSync('./certs/xbank-test.pem'),
};

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 9443,
    strictPort: true,
    allowedHosts: ALLOWED_HOSTS,
    https: httpsOptions,
  },
  preview: {
    host: '0.0.0.0',
    port: 9443,
    strictPort: true,
    allowedHosts: ALLOWED_HOSTS,
    https: httpsOptions,
  },
});
