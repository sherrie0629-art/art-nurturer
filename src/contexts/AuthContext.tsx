import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import AuthPromptDialog from "@/components/AuthPromptDialog";
import { toast } from "sonner";
import {
  migrateGuestChatsToAccount,
  GUEST_MIGRATED_EVENT,
  type GuestMigratedDetail,
} from "@/lib/guestChat";
import { migrateGuestAssessmentsToAccount } from "@/lib/guestAssessment";
import { ACCOUNT_SUSPENDED_MESSAGE } from "@/lib/accountStatus";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAnonymous: boolean;
  isBanned: boolean;
  signOut: () => Promise<void>;
  promptLogin: (reason: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAnonymous: true,
  isBanned: false,
  signOut: async () => {},
  promptLogin: () => {},
});

export const useAuth = () => useContext(AuthContext);

/**
 * Consume OAuth callback parameters from the URL (if present).
 * Handles both PKCE (?code=...) and implicit (#access_token=...) flows,
 * as well as error returns. Returns true if a callback was processed
 * (regardless of success), so the caller can skip the initial getSession race.
 */
const consumeOAuthCallback = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false;

  const url = new URL(window.location.href);
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);

  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error") || hashParams.get("error");
  const errorDescription =
    url.searchParams.get("error_description") || hashParams.get("error_description");
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");

  const cleanUrl = () => {
    const cleaned = new URL(window.location.href);
    ["code", "state", "error", "error_description", "provider_token", "scope"].forEach((k) =>
      cleaned.searchParams.delete(k)
    );
    cleaned.hash = "";
    window.history.replaceState({}, document.title, cleaned.pathname + cleaned.search);
  };

  // Error return from provider
  if (errorParam) {
    toast.error(errorDescription || `登录失败：${errorParam}`);
    cleanUrl();
    return true;
  }

  // PKCE flow: exchange code for session
  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
      if (error) throw error;
      toast.success("登录成功 ✨");
    } catch (err: any) {
      toast.error(err?.message || "Google 登录回调处理失败，请重试");
    } finally {
      cleanUrl();
    }
    return true;
  }

  // Implicit flow: tokens directly in hash
  if (accessToken && refreshToken) {
    try {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
      toast.success("登录成功 ✨");
    } catch (err: any) {
      toast.error(err?.message || "Google 登录回调处理失败，请重试");
    } finally {
      cleanUrl();
    }
    return true;
  }

  return false;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState({ open: false, reason: "" });

  const enforceAccountStatus = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("is_banned, ban_reason")
      .eq("user_id", userId)
      .maybeSingle();

    if (data?.is_banned) {
      setIsBanned(true);
      toast.error(data.ban_reason || ACCOUNT_SUSPENDED_MESSAGE);
      try {
        await supabase.auth.signOut();
      } catch { /* ignore */ }
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
          .forEach((k) => localStorage.removeItem(k));
      } catch { /* ignore */ }
      setSession(null);
      setUser(null);
      return false;
    }

    setIsBanned(false);
    return true;
  }, []);

  useEffect(() => {
    let mounted = true;
    let lastMigratedUserId: string | null = null;

    const runGuestMigration = async (userId: string) => {
      if (lastMigratedUserId === userId) return;
      lastMigratedUserId = userId;
      try {
        const res = await migrateGuestChatsToAccount(userId);
        if (res.migrated > 0) {
          toast.success("已把未登录时的聊天同步到你的账号 ✨");
          window.dispatchEvent(
            new CustomEvent<GuestMigratedDetail>(GUEST_MIGRATED_EVENT, {
              detail: { agentToConversation: res.agentToConversation },
            }),
          );
        }
      } catch (e) {
        console.error("[Auth] guest chat migration failed", e);
      }
    };

    // Set up listener BEFORE any async work, per Supabase guidance.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        setLoginPrompt({ open: false, reason: "" });
        setTimeout(() => {
          enforceAccountStatus(session.user.id).catch((e) => {
            console.error("[Auth] ban check failed", e);
          });
        }, 0);
      } else {
        setIsBanned(false);
      }
      if (event === "SIGNED_IN" && session?.user) {
        // Defer so the auth state update flushes first.
        setTimeout(() => runGuestMigration(session.user.id), 0);
        setTimeout(async () => {
          try {
            const res = await migrateGuestAssessmentsToAccount(session.user.id);
            if (res.migrated > 0) {
              toast.success(`已把未登录时完成的 ${res.migrated} 份测评同步到你的账号 ✨`);
            }
          } catch (e) {
            console.error("[Auth] guest assessment migration failed", e);
          }
        }, 0);
      }
    });

    // Bootstrap: consume any OAuth callback params first, then read session.
    (async () => {
      try {
        await consumeOAuthCallback();
      } catch {
        // swallow — already toasted inside
      }
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      // Validate the bootstrapped session. If the stored access_token is
      // missing/expired/malformed (no `sub` claim — e.g. signing key rotated
      // or storage corrupted), nuke local auth state so supabase-js doesn't
      // keep silently falling back to the anon key while React still thinks
      // a user is signed in. This shows up as 401s from edge functions and
      // RLS violations on inserts.
      const isValidJwt = (token?: string | null) => {
        if (!token) return false;
        const parts = token.split(".");
        if (parts.length !== 3) return false;
        try {
          const payload = JSON.parse(
            atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
          );
          if (!payload?.sub) return false;
          if (payload.exp && payload.exp * 1000 < Date.now()) return false;
          return true;
        } catch {
          return false;
        }
      };

      if (data.session && !isValidJwt(data.session.access_token)) {
        console.warn("[Auth] stored session has invalid JWT, clearing");
        try {
          await supabase.auth.signOut();
        } catch { /* ignore */ }
        // Hard-clean any leftover sb-*-auth-token keys, in case signOut
        // didn't fully drop them (e.g. multiple tab keys, legacy keys).
        try {
          Object.keys(localStorage)
            .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
            .forEach((k) => localStorage.removeItem(k));
        } catch { /* ignore */ }
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user) {
        await enforceAccountStatus(data.session.user.id);
      }
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [enforceAccountStatus]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      try {
        Object.keys(localStorage)
          .filter((k) => k.startsWith("sb-") && k.endsWith("-auth-token"))
          .forEach((k) => localStorage.removeItem(k));
      } catch { /* ignore */ }
      setSession(null);
      setUser(null);
      setIsBanned(false);
      setLoading(false);
    }
  };

  const promptLogin = useCallback((reason: string) => {
    setLoginPrompt({ open: true, reason });
  }, []);

  const isAnonymous = !user;

  return (
    <AuthContext.Provider value={{ user, session, loading, isAnonymous, isBanned, signOut, promptLogin }}>
      {children}
      <AuthPromptDialog
        open={loginPrompt.open}
        reason={loginPrompt.reason}
        onClose={() => setLoginPrompt({ open: false, reason: "" })}
      />
    </AuthContext.Provider>
  );
};
