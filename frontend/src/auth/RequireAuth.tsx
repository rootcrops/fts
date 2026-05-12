import { useEffect, type ReactNode } from "react";
import { useAuth } from "react-oidc-context";

import { setTokenProvider } from "../api/client";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();

  useEffect(() => {
    setTokenProvider(() => auth.user?.access_token ?? null);
  }, [auth.user]);

  if (auth.isLoading) {
    return <p>Loading auth…</p>;
  }
  if (auth.error) {
    return <p>Auth error: {auth.error.message}</p>;
  }
  if (!auth.isAuthenticated) {
    void auth.signinRedirect();
    return <p>Redirecting to sign-in…</p>;
  }
  return <>{children}</>;
}
