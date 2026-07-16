import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import type { Session, SupabaseClient } from '@supabase/supabase-js';

import { AuthContext } from './AuthContext';
import type { AuthContextValue, SignUpOptions } from './AuthContext';

export interface AuthProviderProps extends PropsWithChildren {
  supabase: SupabaseClient;
}

export function AuthProvider({ children, supabase }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let receivedAuthEvent = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;

      receivedAuthEvent = true;
      setSession(nextSession);
      setLoading(false);
    });

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active || receivedAuthEvent) return;

        setSession(error ? null : data.session);
        setLoading(false);
      })
      .catch(() => {
        if (!active || receivedAuthEvent) return;

        setSession(null);
        setLoading(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, [supabase]);

  const signUp = useCallback(
    async (email: string, password: string, options?: SignUpOptions) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });
      if (error) throw error;
    },
    [supabase],
  );

  const resetPassword = useCallback(
    async (email: string, redirectTo?: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        redirectTo ? { redirectTo } : undefined,
      );
      if (error) throw error;
    },
    [supabase],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signIn,
      signOut,
      signUp,
      resetPassword,
    }),
    [loading, resetPassword, session, signIn, signOut, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
