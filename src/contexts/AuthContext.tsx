import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '../types';

// ===========================================
// DEV MODE - Set to true to bypass auth
// ===========================================
const DEV_MODE = true;

const MOCK_USER: User = {
  id: 'dev-user-123',
  email: 'dev@lincc.app',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
};

const MOCK_PROFILE: Profile = {
  id: 'dev-user-123',
  email: 'dev@lincc.app',
  first_name: 'Dev',
  dob: '1995-06-15',
  gender: 'woman',
  avatar_url: null,
  bio: 'This is a dev account for testing the app locally.',
  tags: ['coffee', 'hiking', 'yoga'],
  settings_radius: 10,
  is_ghost_mode: false,
  is_women_only_mode: false,
  terms_accepted_at: new Date().toISOString(),
  role: 'admin', // Admin access for testing
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
// ===========================================

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEV_MODE ? MOCK_USER : null);
  const [profile, setProfile] = useState<Profile | null>(DEV_MODE ? MOCK_PROFILE : null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(!DEV_MODE);

  const fetchProfile = useCallback(async (userId: string) => {
    if (DEV_MODE) return MOCK_PROFILE;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as Profile;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (DEV_MODE) {
      setProfile(MOCK_PROFILE);
      return;
    }
    if (!user) return;
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  }, [user, fetchProfile]);

  useEffect(() => {
    // Skip Supabase auth in dev mode
    if (DEV_MODE) {
      console.log('🔓 DEV MODE: Authentication bypassed with mock user');
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }

      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email: string, password: string) => {
    if (DEV_MODE) return { error: null };
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    if (DEV_MODE) return { error: null };
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error ? new Error(error.message) : null };
  };

  const signInWithMagicLink = async (email: string) => {
    if (DEV_MODE) return { error: null };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    if (DEV_MODE) {
      console.log('🔓 DEV MODE: Sign out simulated');
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: DEV_MODE || !!user,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
