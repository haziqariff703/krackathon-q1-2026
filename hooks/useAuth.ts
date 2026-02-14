import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseClient } from "@/lib/supabaseClient";

// Lightweight auth state hook for client components.
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadUser() {
      const { data, error } = await supabaseClient.auth.getUser();
      if (!isActive) return;
      if (error) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(data.user ?? null);
      setLoading(false);
    }

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (!isActive) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    loadUser();

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabaseClient.auth.signOut();
  };

  return {
    user,
    loading,
    isAuthenticated: Boolean(user),
    logout,
  };
}
