import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export interface SignUpOptions {
  emailRedirectTo?: string;
  data?: Record<string, unknown>;
  captchaToken?: string;
}

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    options?: SignUpOptions,
  ) => Promise<void>;
  resetPassword: (email: string, redirectTo?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
