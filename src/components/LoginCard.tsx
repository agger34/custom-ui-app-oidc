import { useEffect } from 'react';
import { CallbackField } from './CallbackField';
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
        {step?.callbacks.map((callback, idx) => (
          <CallbackField key={`${callback.getType()}-${idx}`} callback={callback} autoFocus={idx === 0} />
        ))}

        <button
          type="submit"
          disabled={status === 'loading' || !step}
          className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'loading' ? 'Đang xử lý…' : 'Tiếp tục'}
        </button>
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
