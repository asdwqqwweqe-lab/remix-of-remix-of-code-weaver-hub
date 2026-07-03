import { supabase } from "@/integrations/supabase/client";

let ensurePromise: Promise<string | null> | null = null;

/**
 * Ensures a Supabase auth session exists (anonymous if needed) and returns
 * the current user id. Cached for the lifetime of the tab.
 */
export function ensureAuth(): Promise<string | null> {
  if (ensurePromise) return ensurePromise;
  ensurePromise = (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user?.id) return data.session.user.id;
    const { data: signIn, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("Anonymous sign-in failed:", error);
      ensurePromise = null;
      return null;
    }
    return signIn.user?.id ?? null;
  })();
  return ensurePromise;
}
