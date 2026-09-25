import { useEffect, useRef, useState } from 'react';
import type { ReCaptchaCallback, ReCaptchaEnterpriseCallback } from '@forgerock/journey-client';
import { loadScriptOnce } from '../lib/recaptcha';

const CLASSIC_SCRIPT_SRC = 'https://www.google.com/recaptcha/api.js?render=explicit';

/**
 * Renders the classic Google reCAPTCHA v2 (checkbox) widget produced by AM's
 * "reCAPTCHA" auth node. `getSiteKey()`/`setResult()` are the exact methods
 * `ReCaptchaCallback` exposes (verified against the installed
 * @forgerock/journey-client source).
 */
export function RecaptchaField({ callback }: { callback: ReCaptchaCallback }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadScriptOnce(CLASSIC_SCRIPT_SRC)
      .then(() => {
        if (cancelled) return;
        window.grecaptcha?.ready(() => {
          if (cancelled || !containerRef.current) return;
          window.grecaptcha!.render(containerRef.current, {
            sitekey: callback.getSiteKey(),
            callback: (token: string) => callback.setResult(token),
            'expired-callback': () => callback.setResult(''),
          });
        });
      })
      .catch((err: Error) => !cancelled && setError(err.message));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <p className="text-sm text-red-700">Không tải được reCAPTCHA: {error}</p>;
  }

  return <div ref={containerRef} />;
}

/**
 * Renders the reCAPTCHA Enterprise widget produced by AM's "reCAPTCHA
 * Enterprise" auth node. AM supplies the script URL and container class
 * itself (`getApiUrl()`/`getElementClass()`), since Enterprise deployments
 * can proxy the Google script through their own domain.
 */
export function RecaptchaEnterpriseField({ callback }: { callback: ReCaptchaEnterpriseCallback }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const scriptSrc =
      callback.getApiUrl() || 'https://www.google.com/recaptcha/enterprise.js?render=explicit';

    loadScriptOnce(scriptSrc)
      .then(() => {
        if (cancelled) return;
        window.grecaptcha?.enterprise?.ready(() => {
          if (cancelled || !containerRef.current) return;
          callback.setAction('login');
          window.grecaptcha!.enterprise!.render(containerRef.current, {
            sitekey: callback.getSiteKey(),
            callback: (token: string) => callback.setResult(token),
          });
        });
      })
      .catch((err: Error) => {
        callback.setClientError(err.message);
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <p className="text-sm text-red-700">Không tải được reCAPTCHA Enterprise: {error}</p>;
  }

  return <div ref={containerRef} className={callback.getElementClass() || undefined} />;
}
