/**
 * Parses the query parameters AM appends when it redirects the browser to this
 * app's URL, per the OAuth2 client's "Custom Login URL Template" (AM Console:
 * realm > Applications > OAuth 2.0 > Clients > <client> > OAuth2 Provider Overrides).
 *
 * Template used on the AM client, e.g. (see README for the http:// / plain-domain variant):
 *   http://login.xbank.test:9443?goto=${goto}
 *     <#if acrValues??>&acr_values=${acrValues}</#if>
 *     <#if realm??>&realm=${realm}</#if>
 *     <#if module??>&module=${module}</#if>
 *     <#if service??>&service=${service}</#if>
 *     <#if locale??>&locale=${locale}</#if>
 */
export interface LoginParams {
  /** URL to redirect the browser to after a successful login (re-enters /oauth2/authorize). */
  goto: string | null;
  /** Realm path AM is authenticating against, e.g. "" (root) or "/customers/europe". */
  realm: string;
  /** Authentication tree (journey) name - present when the client requests a specific journey. */
  service: string | null;
  /** Legacy chain name - only used pre-Trees; kept for completeness. */
  module: string | null;
  acrValues: string | null;
  locale: string | null;
}

export function parseLoginParams(defaultRealm: string, defaultTree: string): LoginParams {
  const params = new URLSearchParams(window.location.search);

  return {
    goto: params.get('goto'),
    realm: params.get('realm') ?? defaultRealm,
    service: params.get('service') ?? defaultTree,
    module: params.get('module'),
    acrValues: params.get('acr_values'),
    locale: params.get('locale'),
  };
}
