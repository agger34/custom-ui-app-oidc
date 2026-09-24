import { useCallback, useEffect, useRef, useState } from 'react';
import { journey, StepType } from '@forgerock/journey-client';
import type { JourneyClient, JourneyResult, JourneyStep } from '@forgerock/journey-client';

export type LoginStatus = 'loading' | 'step' | 'success' | 'failure' | 'error';

interface UseJourneyLoginArgs {
  /**
   * AM base URL including deployment path, e.g. "http://idp.xbank.test:8080/openam".
   *
   * We deliberately configure `journey-client` with `serverConfig.baseUrl` instead of
   * `serverConfig.wellknown`: the installed SDK (`@forgerock/journey-client` 2.2.0, via
   * `@forgerock/sdk-utilities`'s `isValidWellknownUrl`) hard-rejects any wellknown URL that
   * is not `https://` unless the hostname is literally `localhost`/`127.0.0.1` - a plain
   * `http://idp.xbank.test:8080/...` wellknown URL throws "Invalid wellknown URL: ... URL
   * must use HTTPS (or HTTP for localhost)". The `baseUrl` form bypasses OIDC discovery
   * entirely and talks to AM's classic REST endpoints directly
   * (`json/realms/root/realms/<realm>/authenticate`), which has no such restriction.
   */
  amBaseUrl: string;
  /** Realm path, e.g. "" for the top-level/root realm or "xbank" for a sub-realm. */
  realmPath: string;
  tree: string;
}

interface UseJourneyLoginState {
  status: LoginStatus;
  step: JourneyStep | null;
  errorMessage: string | null;
  sessionToken: string | null;
}

/**
 * Drives a PingAM authentication tree over `@forgerock/journey-client`.
 *
 * On mount it calls `client.start({ journey: tree })`; each `submit()` call
 * sends the current callback values to AM via `client.next(step)` until AM
 * returns a LoginSuccess or LoginFailure step.
 */
export function useJourneyLogin({ amBaseUrl, realmPath, tree }: UseJourneyLoginArgs) {
  const clientRef = useRef<JourneyClient | null>(null);
  const [state, setState] = useState<UseJourneyLoginState>({
    status: 'loading',
    step: null,
    errorMessage: null,
    sessionToken: null,
  });

  const applyResult = useCallback((result: JourneyResult) => {
    if ('error' in result) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: result.message ?? result.error,
      }));
      return;
    }

    switch (result.type) {
      case StepType.Step:
        setState((prev) => ({ ...prev, status: 'step', step: result, errorMessage: null }));
        break;
      case StepType.LoginSuccess:
        setState((prev) => ({
          ...prev,
          status: 'success',
          sessionToken: result.getSessionToken() ?? null,
        }));
        break;
      case StepType.LoginFailure:
        setState((prev) => ({
          ...prev,
          status: 'failure',
          errorMessage: result.getMessage() ?? result.getReason() ?? 'Đăng nhập thất bại.',
        }));
        break;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, status: 'loading' }));

    journey({ config: { serverConfig: { baseUrl: amBaseUrl }, realmPath } })
      .then(async (client) => {
        if (cancelled) return;
        clientRef.current = client;
        const result = await client.start({ journey: tree });
        if (!cancelled) applyResult(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            status: 'error',
            errorMessage:
              err instanceof Error ? err.message : 'Không thể kết nối tới máy chủ xác thực (PingAM).',
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [amBaseUrl, realmPath, tree, applyResult]);

  const submit = useCallback(async () => {
    if (!clientRef.current || !state.step) return;
    setState((prev) => ({ ...prev, status: 'loading' }));
    const result = await clientRef.current.next(state.step);
    applyResult(result);
  }, [state.step, applyResult]);

  const retry = useCallback(async () => {
    if (!clientRef.current) return;
    setState((prev) => ({ ...prev, status: 'loading', errorMessage: null }));
    const result = await clientRef.current.start({ journey: tree });
    applyResult(result);
  }, [tree, applyResult]);

  return { ...state, submit, retry };
}
