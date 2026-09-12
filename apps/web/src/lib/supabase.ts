import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
/** Prevents React Strict Mode double-mount from exchanging the PKCE code twice. */
let oauthCallbackInflight: Promise<Session> | null = null;

const STORAGE_KEY = "webform-supabase-auth";

export function getSupabase(): SupabaseClient | null {
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? "";
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? "";
  if (!url || !anonKey) return null;

  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Manual exchange on /auth/callback — avoids racing detectSessionInUrl + exchangeCodeForSession
        // (and React Strict Mode remounts that clear the PKCE verifier).
        detectSessionInUrl: false,
        flowType: "pkce",
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        storageKey: STORAGE_KEY,
      },
    });
  }
  return client;
}

export function isSupabaseConfigured() {
  return Boolean(getSupabase());
}

const REDIRECT_KEY = "webform_auth_redirect";

export function rememberAuthRedirect(path: string) {
  if (path.startsWith("/")) {
    sessionStorage.setItem(REDIRECT_KEY, path);
  }
}

export function takeAuthRedirect(fallback = "/app") {
  const value = sessionStorage.getItem(REDIRECT_KEY);
  sessionStorage.removeItem(REDIRECT_KEY);
  return value && value.startsWith("/") ? value : fallback;
}

export async function startGoogleOAuth(redirectPath = "/app") {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
  rememberAuthRedirect(redirectPath);
  oauthCallbackInflight = null;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });
  if (error) throw error;
}

/**
 * Finish PKCE OAuth on /auth/callback. Safe to call twice (React Strict Mode).
 */
export async function completeOAuthCallback(): Promise<Session> {
  if (oauthCallbackInflight) return oauthCallbackInflight;

  oauthCallbackInflight = (async () => {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error("Supabase is not configured in the web app.");
    }

    const url = new URL(window.location.href);
    const oauthError = url.searchParams.get("error_description") || url.searchParams.get("error");
    if (oauthError) {
      throw new Error(oauthError);
    }

    const existing = await supabase.auth.getSession();
    if (existing.data.session) return existing.data.session;

    const code = url.searchParams.get("code");
    if (!code) {
      throw new Error("No OAuth code found. Try Continue with Google again from the sign-in page.");
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    if (!data.session) {
      throw new Error("No Supabase session found after Google sign-in.");
    }
    return data.session;
  })();

  try {
    return await oauthCallbackInflight;
  } catch (err) {
    oauthCallbackInflight = null;
    throw err;
  }
}
