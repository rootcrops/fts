import { useEffect, type ReactNode } from "react";
import { useAuth } from "react-oidc-context";

import { setTokenProvider } from "../api/client";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const auth = useAuth();

  useEffect(() => {
    setTokenProvider(() => auth.user?.access_token ?? null);
  }, [auth.user]);

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && !auth.error) {
      void auth.signinRedirect();
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.error, auth]);

  if (auth.isLoading) {
    return <p>Loading auth…</p>;
  }
  if (auth.error) {
    return <p>Auth error: {auth.error.message}</p>;
  }
  if (!auth.isAuthenticated) {
    return <p>Redirecting to sign-in…</p>;
  }
  return <>{children}</>;
}
