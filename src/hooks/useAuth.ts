import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchIsAdmin = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();

        if (error) {
          console.error("[useAuth] role lookup error", error);
          return false;
        }

        return !!data;
      } catch (e) {
        console.error("[useAuth] role lookup exception", e);
        return false;
      }
    };

    const applySession = async (nextSession: Session | null) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        const nextIsAdmin = await fetchIsAdmin(nextSession.user.id);
        if (!mounted) return;
        setIsAdmin(nextIsAdmin);
        console.log("[useAuth] session user", nextSession.user.id, nextSession.user.email, { isAdmin: nextIsAdmin });
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    };

    // Set up auth state listener BEFORE checking session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      await applySession(nextSession);
    });

    // Check for existing session
    supabase.auth
      .getSession()
      .then(async ({ data: { session: existingSession } }) => {
        await applySession(existingSession);
      })
      .catch((e) => {
        console.error("[useAuth] getSession error", e);
        setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Workaround: in some environments the SDK call can appear to hang even though
    // the underlying network request succeeds. We call the auth endpoint directly
    // and then hydrate the SDK session via setSession.
    const controller = new AbortController();
    const timeoutMs = 15000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = (json as any)?.error_description || (json as any)?.error || "Invalid login credentials";
        return { error: { message: msg } };
      }

      const access_token = (json as any)?.access_token as string | undefined;
      const refresh_token = (json as any)?.refresh_token as string | undefined;

      if (!access_token || !refresh_token) {
        return { error: { message: "Sign in succeeded but session tokens were missing." } };
      }

      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      return { error };
    } catch (e: any) {
      if (e?.name === "AbortError") {
        return { error: { message: "Sign in timed out. Please try again." } };
      }
      return { error: { message: e?.message || "Sign in failed. Please try again." } };
    } finally {
      clearTimeout(timeout);
    }
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setIsAdmin(false);
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
    isAdmin,
  };
}
