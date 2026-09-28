import { useEffect, useRef, useState } from 'react';
import { WebAuthn, WebAuthnStepType } from '@forgerock/journey-client/webauthn';
import type { JourneyStep } from '@forgerock/journey-client';

interface WebAuthnStepProps {
  step: JourneyStep;
  stepType: WebAuthnStepType;
  onDone: () => void;
}

/**
 * Handles an AM "WebAuthn Authentication/Registration Node" step - these
 * carry no field for the user to fill in; the browser's own WebAuthn dialog
 * (fingerprint/Face ID/security key) IS the UI, triggered automatically via
 * `navigator.credentials.get()`/`create()` (wrapped by the SDK's `WebAuthn`
 * helper). Whatever the outcome - success, browser unsupported, user
 * cancelled - `WebAuthn.authenticate()`/`register()` already records it into
 * the step's hidden callback, so we always call `onDone()` (submit)
 * afterwards and let the AM node route accordingly (e.g. fall back to a
 * password login, per this tree's design).
 */
export function WebAuthnStep({ step, stepType, onDone }: WebAuthnStepProps) {
  const ranForStepRef = useRef<JourneyStep | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ranForStepRef.current === step) return;
    ranForStepRef.current = step;
    setError(null);

    (async () => {
      try {
        if (stepType === WebAuthnStepType.Registration) {
          await WebAuthn.register(step);
        } else {
          await WebAuthn.authenticate(step);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'WebAuthn thất bại');
      } finally {
        onDone();
      }
    })();
  }, [step, stepType, onDone]);

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
      <p className="text-sm text-slate-600">
        {stepType === WebAuthnStepType.Registration
          ? 'Đang thiết lập đăng nhập không cần mật khẩu — làm theo hướng dẫn của trình duyệt (vân tay, Face ID, khoá bảo mật...).'
          : 'Đang chờ xác thực — làm theo hướng dẫn của trình duyệt (vân tay, Face ID, khoá bảo mật...).'}
      </p>
      {error && <p className="text-xs text-amber-700">{error}</p>}
    </div>
  );
}
