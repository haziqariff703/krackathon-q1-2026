import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

// Redirects unauthenticated users to /login.
export function useProtectedRoute() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  return { user, loading, isAuthenticated: Boolean(user) };
}
