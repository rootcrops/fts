import { useQuery } from "@tanstack/react-query";

import { listUsers } from "../api/users";
import { useMe } from "./useMe";

export const useUsers = () => {
  const { data: me } = useMe();
  return useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    enabled: me?.role === "admin",
    staleTime: 30_000,
  });
};
