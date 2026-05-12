import { useQuery } from "@tanstack/react-query";
import { useAuth } from "react-oidc-context";

import { fetchMe } from "../api/users";

export const useMe = () => {
  const auth = useAuth();
  return useQuery({
    queryKey: ["me", auth.user?.profile?.sub],
    queryFn: fetchMe,
    enabled: auth.isAuthenticated,
    staleTime: 60_000,
  });
};
