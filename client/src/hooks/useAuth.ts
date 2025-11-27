import { useQuery } from "@tanstack/react-query";

interface SessionResponse {
  user: any;
  isAuthenticated: boolean;
}

export function useAuth() {
  const { data, isLoading } = useQuery<SessionResponse>({
    queryKey: ["/api/auth/session"],
    retry: false,
  });

  return {
    user: data?.user,
    isLoading,
    isAuthenticated: data?.isAuthenticated ?? false,
  };
}
