import { useMemo } from 'react';
import { LoginCard } from './components/LoginCard';
import { parseLoginParams } from './lib/loginParams';

const AM_BASE_URL = import.meta.env.VITE_AM_BASE_URL as string;
const DEFAULT_REALM = (import.meta.env.VITE_DEFAULT_REALM as string) ?? '';
const DEFAULT_TREE = (import.meta.env.VITE_DEFAULT_TREE as string) || 'Login';

export default function App() {
  const params = useMemo(() => parseLoginParams(DEFAULT_REALM, DEFAULT_TREE), []);

  if (!AM_BASE_URL) {
    return (
      <Centered>
        <p className="max-w-sm text-sm text-red-700">
          Thiếu biến môi trường <code>VITE_AM_BASE_URL</code>. Xem <code>.env.example</code>.
        </p>
      </Centered>
    );
  }

  return (
    <Centered>
      <LoginCard
        amBaseUrl={AM_BASE_URL}
        realmPath={params.realm}
        tree={params.service ?? DEFAULT_TREE}
        goto={params.goto}
      />
    </Centered>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center px-4">{children}</div>;
}
