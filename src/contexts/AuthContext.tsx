import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
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
  notification_preferences: null,
  last_lat: null,
  last_lng: null,
  is_business: false,
  business_name: null,
  business_logo_url: null,
  business_category: null,
  business_description: null,
  business_address: null,
  business_opening_hours: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
// ===========================================

const LOG = '[Auth]';

function checkProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  return (
    !!profile.first_name?.trim() &&
    !!profile.dob?.trim() &&
    (profile.gender === 'female' || profile.gender === 'male') &&
    Array.isArray(profile.tags) && profile.tags.length >= 1 &&
    !!profile.avatar_url?.trim()
  );
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(DEV_MODE ? MOCK_USER : null);
  const [profile, setProfile] = useState<Profile | null>(DEV_MODE ? MOCK_PROFILE : null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(!DEV_MODE);

  // Fetch profile — standalone, with single retry on failure
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (DEV_MODE) return MOCK_PROFILE;
    console.log(LOG, 'Fetching profile for', userId);

    const attempt = async (): Promise<Profile | null> => {
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
    };

    const result = await attempt();
    if (result) return result;

    // Single retry after 1s — handles transient DB hiccups
    console.log(LOG, 'Profile fetch failed, retrying in 1s...');
    await new Promise(r => setTimeout(r, 1000));
    return attempt();
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

      // TOKEN_REFRESHED — just update session, don't touch profile or loading
      if (event === 'TOKEN_REFRESHED') {
        console.log(LOG, 'Token refreshed');
        setSession(session);
        setUser(session?.user ?? null);
        return;
      }

      // Synchronously update session and user — no async work here
      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        setProfile(null);
        setIsLoading(false);
      } else if (event === 'PASSWORD_RECOVERY') {
        // User clicked the password reset link in their email — redirect to reset page
        navigate('/reset-password');
      } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        // Check email verification — if not confirmed, sign out immediately
        // (Magic link logins auto-verify, so this only catches unverified email/password signups)
        if (session?.user && !session.user.email_confirmed_at) {
          console.log(LOG, 'Email not verified, signing out');
          setTimeout(() => {
            supabase.auth.signOut().then(() => {
              window.dispatchEvent(new CustomEvent('lincc:toast', {
                detail: { message: 'Please verify your email first', type: 'error' },
              }));
            });
          }, 0);
          return;
        }
        // User just signed in — ensure loading stays true until Effect 2 fetches profile.
        setProfile(null);
        setIsLoading(true);
      }
    });

    // Bootstrap: explicitly check for existing session (handles magic link hash tokens
    // that may have been exchanged before the listener was ready)
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(LOG, 'getSession bootstrap:', session?.user?.email || 'no session');
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        setIsLoading(true); // Effect 2 will fetch profile
      } else {
        setIsLoading(false);
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

  const resetPassword = async (email: string) => {
    if (DEV_MODE) return { error: null };
    console.log(LOG, 'resetPassword:', email);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) console.error(LOG, 'resetPassword error:', error.message);
    return { error: error ? new Error(error.message) : null };
  };

  const updatePassword = async (password: string) => {
    if (DEV_MODE) return { error: null };
    console.log(LOG, 'updatePassword');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) console.error(LOG, 'updatePassword error:', error.message);
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
    isProfileComplete: checkProfileComplete(profile),
    signUp,
    signIn,
    signInWithMagicLink,
    resetPassword,
    updatePassword,
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
