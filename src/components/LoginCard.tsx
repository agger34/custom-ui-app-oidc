import { useEffect } from 'react';
import { QRCode } from '@forgerock/journey-client/qr-code';
import { RecoveryCodes } from '@forgerock/journey-client/recovery-codes';
import { WebAuthn, WebAuthnStepType } from '@forgerock/journey-client/webauthn';
import { ConfirmationCallback, HiddenValueCallback, TextOutputCallback } from '@forgerock/journey-client';
import { CallbackField } from './CallbackField';
import { QrCodeDisplay } from './QrCodeDisplay';
import { RecoveryCodesDisplay } from './RecoveryCodesDisplay';
import { WebAuthnStep } from './WebAuthnStep';
import { useJourneyLogin } from '../lib/useJourneyLogin';

interface LoginCardProps {
  amBaseUrl: string;
  realmPath: string;
  tree: string;
  goto: string | null;
}

export function LoginCard({ amBaseUrl, realmPath, tree, goto }: LoginCardProps) {
  const { status, step, errorMessage, sessionToken, submit, retry } = useJourneyLogin({
    amBaseUrl,
    realmPath,
    tree,
  });

  // Session established on AM (cookie set by the /authenticate call) - hand
  // the browser back to AM's /oauth2/authorize via the `goto` AM supplied so
  // it can finish issuing the authorization code to the requesting OIDC client.
  useEffect(() => {
    if (status !== 'success') return;
    if (!goto) return;
    window.location.assign(goto);
  }, [status, goto]);

  if (status === 'success') {
    if (!goto) {
      return (
        <Card>
          <p className="text-sm text-amber-800">
            Đăng nhập thành công nhưng không có tham số <code>goto</code> để quay lại ứng dụng gốc.
            Kiểm tra lại Custom Login URL Template trên client OAuth2/OIDC ở PingAM.
          </p>
        </Card>
      );
    }
    return (
      <Card>
        <p className="text-sm text-slate-600">Đăng nhập thành công, đang chuyển hướng…</p>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card>
        <p className="mb-4 text-sm text-red-700">{errorMessage}</p>
        <button
          type="button"
          onClick={retry}
          className="w-full rounded-lg bg-slate-800 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Thử lại
        </button>
      </Card>
    );
  }

  // AM's "WebAuthn Authentication/Registration Node" steps carry no field to
  // fill in - the browser's own WebAuthn dialog is the UI, triggered
  // automatically. Render that instead of the normal form for this step.
  const webAuthnStepType = step ? WebAuthn.getWebAuthnStepType(step) : WebAuthnStepType.None;
  if (step && webAuthnStepType !== WebAuthnStepType.None) {
    return (
      <Card>
        <h1 className="mb-2 text-xl font-semibold text-slate-900">Đăng nhập</h1>
        <WebAuthnStep step={step} stepType={webAuthnStepType} onDone={() => void submit()} />
      </Card>
    );
  }

  // AM's "OATH Registration" / "Recovery Code Display" nodes don't map to a
  // single form field - they're a whole step (a QR code to scan, or a list
  // of one-time codes to save). Detect those via the SDK's own step-level
  // helpers and render a dedicated view instead of looping per-callback for
  // the fields they carry (QRCode.isQRCodeStep / RecoveryCodes.isDisplayStep).
  const isQrStep = step ? QRCode.isQRCodeStep(step) : false;
  const qrData = step && isQrStep ? QRCode.getQRCodeData(step) : null;
  const isRecoveryStep = step ? RecoveryCodes.isDisplayStep(step) : false;
  const recoveryCodes = step && isRecoveryStep ? RecoveryCodes.getCodes(step) : null;
  const recoveryDeviceName = step && isRecoveryStep ? RecoveryCodes.getDeviceName(step) : '';

  // ConfirmationCallback renders its own submit buttons (see CallbackField) -
  // the shared "Tiếp tục" button below would be a redundant, ambiguous
  // second way to submit the same step, so hide it whenever one is present.
  const hasConfirmation = step?.callbacks.some((cb) => cb instanceof ConfirmationCallback) ?? false;

  const remainingCallbacks =
    step?.callbacks.filter((callback) => {
      if (isQrStep && (callback instanceof HiddenValueCallback || callback instanceof TextOutputCallback)) {
        return false; // already shown via QrCodeDisplay
      }
      if (isRecoveryStep && callback instanceof TextOutputCallback) {
        return false; // already shown via RecoveryCodesDisplay
      }
      return true;
    }) ?? [];

  return (
    <Card>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Đăng nhập</h1>

      {status === 'failure' && errorMessage && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
      )}

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {qrData && <QrCodeDisplay data={qrData} />}
        {recoveryCodes && (
          <RecoveryCodesDisplay codes={recoveryCodes} deviceName={recoveryDeviceName} />
        )}

        {remainingCallbacks.map((callback, idx) => (
          <CallbackField key={`${callback.getType()}-${idx}`} callback={callback} autoFocus={idx === 0} />
        ))}

        {!hasConfirmation && (
          <button
            type="submit"
            disabled={status === 'loading' || !step}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'loading' ? 'Đang xử lý…' : 'Tiếp tục'}
          </button>
        )}
      </form>

      {/* Dev-only aid: never render session tokens in a production build. */}
      {import.meta.env.DEV && sessionToken && (
        <p className="mt-4 break-all text-xs text-slate-400">tokenId: {sessionToken}</p>
      )}
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md ring-1 ring-slate-200">
      {children}
    </div>
  );
}
