import { oidc } from '@forgerock/oidc-client';

/**
 * `@forgerock/oidc-client` (unlike `@forgerock/journey-client`) does NOT
 * enforce an HTTPS-only wellknown URL - confirmed by inspecting the
 * installed package (no `isValidWellknownUrl` import in its client.store.js)
 * and by a live smoke test against this lab's AM over plain HTTP. So, unlike
 * the shared login UI project, no baseUrl workaround is needed here.
 */
export async function createOidcClient() {
  return oidc({
    config: {
      clientId: import.meta.env.VITE_OIDC_CLIENT_ID,
      redirectUri: import.meta.env.VITE_OIDC_REDIRECT_URI,
      scope: import.meta.env.VITE_OIDC_SCOPE,
      serverConfig: {
        wellknown: import.meta.env.VITE_OIDC_WELLKNOWN,
      },
    },
  });
}

/**
 * Generic (not `unknown`-typed) on purpose: `oidc()` and most of its client
 * methods resolve to a `SuccessShape | GenericError` union with no common
 * discriminant tag, so narrowing has to happen against the exact union at
 * each call site (`Extract<T, ErrorShape>` / its complement) rather than
 * against a separately-imported `GenericError` type, which does not
 * structurally match closely enough for `Exclude` to drop it.
 */
export function isOidcError<T>(value: T): value is Extract<T, { error: string }> {
  return typeof value === 'object' && value !== null && 'error' in value;
}
