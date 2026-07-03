import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { lovable } from '@/integrations/lovable';

const FIRST_LOGIN_KEY = 'blog_first_login';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  session: Session | null;
  signInWithGoogle: () => Promise<{ error?: Error }>;
  logout: () => Promise<void>;
  firstLoginDate: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firstLoginDate, setFirstLoginDate] = useState<string | null>(null);

  useEffect(() => {
    // Set up listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user && !localStorage.getItem(FIRST_LOGIN_KEY)) {
        const firstLoginData = {
          timestamp: new Date().toISOString(),
          date: new Date().toLocaleString('ar-EG'),
        };
        localStorage.setItem(FIRST_LOGIN_KEY, JSON.stringify(firstLoginData));
        setFirstLoginDate(firstLoginData.date);
      }
    });

    // Then hydrate current session
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      setIsLoading(false);
    });

    const firstLogin = localStorage.getItem(FIRST_LOGIN_KEY);
    if (firstLogin) {
      try {
        setFirstLoginDate(JSON.parse(firstLogin).date);
      } catch {
        // ignore parse errors
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if ((result as any).error) return { error: (result as any).error };
    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!session,
      isLoading,
      user,
      session,
      signInWithGoogle,
      logout,
      firstLoginDate,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
