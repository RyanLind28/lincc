import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '../types';

// ===========================================
// DEV MODE - Set to true to bypass auth
// ===========================================
const DEV_MODE = false;

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
  gender: 'female',
  avatar_url: null,
  bio: 'This is a dev account for testing the app locally.',
  tags: ['coffee', 'hiking', 'yoga'],
  settings_radius: 10,
  is_ghost_mode: false,
  is_women_only_mode: false,
  terms_accepted_at: new Date().toISOString(),
  role: 'admin',
  status: 'active',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
// ===========================================

const LOG = '[Auth]';

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
  refreshProfile: (userId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(DEV_MODE ? MOCK_USER : null);
  const [profile, setProfile] = useState<Profile | null>(DEV_MODE ? MOCK_PROFILE : null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(!DEV_MODE);

  // Fetch profile — standalone, no race conditions
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (DEV_MODE) return MOCK_PROFILE;
    console.log(LOG, 'Fetching profile for', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error(LOG, 'Profile fetch error:', error.message, error.code);
        return null;
      }
      console.log(LOG, 'Profile loaded:', data?.first_name, '| terms:', !!data?.terms_accepted_at);
      return data as Profile;
    } catch (err) {
      console.error(LOG, 'Profile fetch exception:', err);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async (userId?: string) => {
    if (DEV_MODE) { setProfile(MOCK_PROFILE); return; }
    const id = userId || user?.id;
    if (!id) return;
    const p = await fetchProfile(id);
    setProfile(p);
  }, [user, fetchProfile]);

  // Effect 1: Listen for auth state changes (session/user only, no async work)
  useEffect(() => {
    if (DEV_MODE) {
      console.log(LOG, 'DEV MODE active');
      setIsLoading(false);
      return;
    }

    console.log(LOG, 'Setting up auth listener...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(LOG, 'onAuthStateChange:', event, session?.user?.email || 'no user');

      // Synchronously update session and user — no async work here
      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        setProfile(null);
        setIsLoading(false);
      } else if (event === 'SIGNED_IN') {
        // User just signed in — ensure loading stays true until Effect 2 fetches profile.
        // Without this, there's a render frame with isLoading=false + profile=null,
        // which causes ProtectedRoute to redirect to /terms or /onboarding prematurely.
        setProfile(null);
        setIsLoading(true);
      }
    });

    return () => {
      console.log(LOG, 'Cleanup: unsubscribing auth listener');
      subscription.unsubscribe();
    };
  }, []);

  // Effect 2: When user changes, fetch their profile
  useEffect(() => {
    if (DEV_MODE) return;

    if (!user) {
      // No user — we're done loading
      console.log(LOG, 'No user, done loading');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    console.log(LOG, 'User changed, fetching profile for', user.email);

    fetchProfile(user.id).then((profileData) => {
      if (cancelled) {
        console.log(LOG, 'Profile fetch cancelled (stale)');
        return;
      }
      setProfile(profileData);
      setIsLoading(false);
      console.log(LOG, 'Auth ready:', {
        email: user.email,
        name: profileData?.first_name,
        terms: !!profileData?.terms_accepted_at,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [user, fetchProfile]);

  const signUp = async (email: string, password: string) => {
    if (DEV_MODE) return { error: null };
    console.log(LOG, 'signUp:', email);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) console.error(LOG, 'signUp error:', error.message);
    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    if (DEV_MODE) return { error: null };
    console.log(LOG, 'signIn:', email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) console.error(LOG, 'signIn error:', error.message);
    return { error: error ? new Error(error.message) : null };
  };

  const signInWithMagicLink = async (email: string) => {
    if (DEV_MODE) return { error: null };
    console.log(LOG, 'magicLink:', email);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) console.error(LOG, 'magicLink error:', error.message);
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    if (DEV_MODE) return;
    console.log(LOG, 'Signing out');
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

  console.log(LOG, 'State:', { isLoading, auth: !!user, profile: !!profile, name: profile?.first_name || null });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
