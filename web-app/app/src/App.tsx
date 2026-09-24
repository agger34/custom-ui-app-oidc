import { useCallback, useEffect, useRef, useState } from 'react';
import { createOidcClient, isOidcError } from './lib/oidcClient';
import type { OauthTokens, UserInfoResponse } from '@forgerock/oidc-client';

type OidcClient = Awaited<ReturnType<typeof createOidcClient>>;

type Status = 'initializing' | 'anonymous' | 'exchanging' | 'authenticated' | 'error';

const APP_NAME = 'App';

export default function App() {
  const clientRef = useRef<OidcClient | null>(null);
  // Guards against React 18 StrictMode's dev-only double-invoke of this
  // effect (mount -> cleanup -> mount again). The authorization `code` is
  // single-use, so a second `token.exchange(code, state)` call from the
  // re-run effect fails with a "State mismatch" error from the SDK (the
  // first call already consumed/cleared the stored state). This ref makes
  // the exchange run exactly once regardless of StrictMode.
  const effectRanRef = useRef(false);
  const [status, setStatus] = useState<Status>('initializing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tokens, setTokens] = useState<OauthTokens | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);

  useEffect(() => {
    // Runs the bootstrap/token-exchange logic exactly once. No `cancelled`
    // cleanup flag here on purpose: combined with the ref guard above, a
    // `cancelled` flag set by StrictMode's synthetic cleanup (which fires
    // right after this first, real invocation) would suppress every
    // `setStatus(...)` below and leave the UI stuck on "initializing" -
    // this component has no real unmount case in normal app usage.
    if (effectRanRef.current) return;
    effectRanRef.current = true;

    (async () => {
      const client = await createOidcClient();
      if (isOidcError(client)) {
        setStatus('error');
        setErrorMessage(client.error);
        return;
      }
      clientRef.current = client;

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const oauthError = params.get('error');

      if (oauthError) {
        setStatus('error');
        setErrorMessage(`${oauthError}: ${params.get('error_description') ?? ''}`);
        return;
      }

      if (code && state) {
        setStatus('exchanging');
        const result = await client.token.exchange(code, state);
        // Drop ?code&state from the URL regardless of outcome so a refresh
        // doesn't try to replay the (single-use) authorization code.
        window.history.replaceState({}, '', window.location.pathname);

        if (isOidcError(result) || 'error' in result) {
          setStatus('error');
          setErrorMessage('error' in result ? String(result.error) : 'Token exchange failed');
          return;
        }

        setTokens(result);
        setStatus('authenticated');
        await loadUserInfo(client);
        return;
      }

      const existing = await client.token.get();
      if ('accessToken' in existing) {
        setTokens(existing);
        setStatus('authenticated');
        await loadUserInfo(client);
      } else {
        setStatus('anonymous');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserInfo = useCallback(async (client: OidcClient) => {
    if (isOidcError(client)) return;
    const info = await client.user.info();
    if (!isOidcError(info)) setUserInfo(info);
  }, []);

  const login = useCallback(async () => {
    if (!clientRef.current || isOidcError(clientRef.current)) return;
    const url = await clientRef.current.authorize.url();
    if (isOidcError(url)) {
      setStatus('error');
      setErrorMessage(url.message ?? url.error);
      return;
    }
    window.location.assign(url);
  }, []);

  const logout = useCallback(async () => {
    if (!clientRef.current || isOidcError(clientRef.current)) return;
    await clientRef.current.token.revoke();
    setTokens(null);
    setUserInfo(null);
    setStatus('anonymous');
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md ring-1 ring-slate-200">
        <h1 className="mb-1 text-xl font-semibold text-indigo-700">{APP_NAME}</h1>
        <p className="mb-6 text-sm text-slate-500">OIDC test client #1 - app.xbank.test</p>

        {status === 'initializing' && <p className="text-sm text-slate-500">Đang khởi tạo…</p>}
        {status === 'exchanging' && (
          <p className="text-sm text-slate-500">Đang đổi authorization code lấy token…</p>
        )}

        {status === 'error' && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
        )}

        {status === 'anonymous' && (
          <button
            type="button"
            onClick={() => void login()}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Đăng nhập
          </button>
        )}

        {status === 'authenticated' && (
          <div className="space-y-4">
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Đã đăng nhập thành công.
            </div>

            {userInfo && (
              <div>
                <h2 className="mb-1 text-sm font-medium text-slate-700">User info</h2>
                <pre className="max-h-40 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-slate-600">
                  {JSON.stringify(userInfo, null, 2)}
                </pre>
              </div>
            )}

            {import.meta.env.DEV && tokens && (
              <div>
                <h2 className="mb-1 text-sm font-medium text-slate-700">Tokens (dev only)</h2>
                <pre className="max-h-40 overflow-auto break-all rounded-md bg-slate-50 p-3 text-xs text-slate-600">
                  {JSON.stringify(tokens, null, 2)}
                </pre>
              </div>
            )}

            <button
              type="button"
              onClick={() => void logout()}
              className="w-full rounded-lg bg-slate-800 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
