import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, Business, AccountType } from '../types';

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
  last_name: 'User',
  profile_name: 'Dev User',
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
  account_type: 'personal',
  welcomed_at: new Date().toISOString(),
  onboarding_step: null,
  allow_dms: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
// ===========================================

const log = (...args: unknown[]) => { if (DEV_MODE) console.log('[Auth]', ...args); };

function checkProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  // Business accounts only need first_name (= contact name); demographics are
  // not asked. Personal accounts need the full set.
  if (profile.account_type === 'business') {
    return !!profile.first_name?.trim();
  }
  return (
    !!profile.first_name?.trim() &&
    !!profile.dob?.trim() &&
    (profile.gender === 'female' || profile.gender === 'male') &&
    Array.isArray(profile.tags) && profile.tags.length >= 1
  );
}

export interface SignUpOptions {
  accountType: AccountType;
  termsAccepted?: boolean;
  ageConfirmed?: boolean;
  firstName?: string;
  lastName?: string;
  profileName?: string;
  // Business-only:
  businessName?: string;
  businessCategory?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  business: Business | null;
  isBusinessApproved: boolean;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  signUp: (email: string, password: string, options: SignUpOptions) => Promise<{ error: Error | null; alreadyExists?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signInWithProvider: (provider: 'google' | 'apple') => Promise<{ error: Error | null }>;
  resendConfirmation: (email: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<void>;
  refreshBusiness: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(DEV_MODE ? MOCK_USER : null);
  const [profile, setProfile] = useState<Profile | null>(DEV_MODE ? MOCK_PROFILE : null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(!DEV_MODE);

  // Fetch profile — standalone, with single retry on failure
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (DEV_MODE) return MOCK_PROFILE;
    log('Fetching profile for', userId);

    const attempt = async (): Promise<Profile | null> => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          log('Profile fetch error:', error.message, error.code);
          return null;
        }
        log('Profile loaded:', data?.first_name, '| terms:', !!data?.terms_accepted_at);
        return data as Profile;
      } catch (err) {
        log('Profile fetch exception:', err);
        return null;
      }
    };

    const result = await attempt();
    if (result) return result;

    // Single retry after 1s — handles transient DB hiccups
    log('Profile fetch failed, retrying in 1s...');
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

  const fetchBusinessForOwner = useCallback(async (ownerId: string): Promise<Business | null> => {
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle();
    return (data ?? null) as Business | null;
  }, []);

  const refreshBusiness = useCallback(async () => {
    if (!user?.id || profile?.account_type !== 'business') {
      setBusiness(null);
      return;
    }
    setBusiness(await fetchBusinessForOwner(user.id));
  }, [user?.id, profile?.account_type, fetchBusinessForOwner]);

  // Effect 1: Listen for auth state changes (session/user only, no async work)
  useEffect(() => {
    if (DEV_MODE) {
      log('DEV MODE active');
      setIsLoading(false);
      return;
    }

    log('Setting up auth listener...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      log('onAuthStateChange:', event, session?.user?.email || 'no user');

      // TOKEN_REFRESHED — just update session, don't touch profile or loading
      if (event === 'TOKEN_REFRESHED') {
        log('Token refreshed');
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
        // Note: we don't check email_confirmed_at here. Supabase enforces confirmation
        // at signInWithPassword (returns "Email not confirmed" error when the setting is on),
        // and the session.user object from a manual setSession() doesn't include that field
        // (it's not in the JWT) — checking it would spuriously sign out users who just
        // clicked the confirm-email link.
        setProfile(null);
        setIsLoading(true);
      }
    });

    // Bootstrap: handle magic link hash tokens that React Router may strip,
    // then check for existing session
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token') || hash.includes('type=magiclink') || hash.includes('type=recovery'))) {
      log('Detected auth hash fragment, exchanging...');
      // Parse hash params and let Supabase exchange the token
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ data: { session } }) => {
          log('Hash token exchanged:', session?.user?.email || 'failed');
          // Clean the hash from the URL
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
          if (session?.user) {
            setSession(session);
            setUser(session.user);
            setIsLoading(true);
          } else {
            setIsLoading(false);
          }
        });
      } else {
        setIsLoading(false);
      }
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        log('getSession bootstrap:', session?.user?.email || 'no session');
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          setIsLoading(true); // Effect 2 will fetch profile
        } else {
          setIsLoading(false);
        }
      });
    }

    return () => {
      log('Cleanup: unsubscribing auth listener');
      subscription.unsubscribe();
    };
  }, []);

  // Effect 2: When user changes, fetch their profile
  useEffect(() => {
    if (DEV_MODE) return;

    if (!user) {
      // No user — we're done loading
      log('No user, done loading');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    log('User changed, fetching profile for', user.email);

    fetchProfile(user.id).then(async (profileData) => {
      if (cancelled) {
        log('Profile fetch cancelled (stale)');
        return;
      }
      setProfile(profileData);

      // For business accounts, also load the linked business record
      if (profileData?.account_type === 'business') {
        const biz = await fetchBusinessForOwner(user.id);
        if (cancelled) return;
        setBusiness(biz);
      } else {
        setBusiness(null);
      }

      setIsLoading(false);
      log('Auth ready:', {
        email: user.email,
        name: profileData?.first_name,
        terms: !!profileData?.terms_accepted_at,
      });

      // Fire-and-forget welcome email for first-time confirmed users. The Edge
      // Function is idempotent (checks welcomed_at + requires email_confirmed_at),
      // so calling it repeatedly is safe — stops silently after the first send.
      // Explicitly fetch the session so we send the user's access token, not the
      // anon key fallback that .invoke() uses when session() returns null.
      if (profileData && !profileData.welcomed_at && user.email_confirmed_at) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) return;
          supabase.functions.invoke('send-welcome-email', {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }).catch((err) => log('Welcome email invoke failed:', err));
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user, fetchProfile, fetchBusinessForOwner]);

  const signUp = async (email: string, password: string, options: SignUpOptions) => {
    if (DEV_MODE) return { error: null };
    log('signUp:', email, 'as', options.accountType);
    const metadata: Record<string, unknown> = {
      account_type: options.accountType,
      is_business: options.accountType === 'business', // legacy fallback for the trigger during deploy window
    };
    if (options.termsAccepted) metadata.terms_accepted_at = new Date().toISOString();
    if (options.ageConfirmed) metadata.age_confirmed = true;
    // Names sent for both account types — handle_new_user reads first_name +
    // last_name + profile_name and sets defaults so no signup ever produces a
    // nameless or blank-display-name profile.
    if (options.firstName) metadata.first_name = options.firstName.trim();
    if (options.lastName) metadata.last_name = options.lastName.trim();
    if (options.profileName) metadata.profile_name = options.profileName.trim();
    if (options.accountType === 'business') {
      if (options.businessName) metadata.business_name = options.businessName.trim();
      if (options.businessCategory) metadata.business_category = options.businessCategory;
    }
    // Business accounts land on /business/verify after clicking the email link
    // so they upload their documents before hitting the dashboard. Personal
    // accounts use the default redirect (Site URL → /).
    const emailRedirectTo = options.accountType === 'business'
      ? `${window.location.origin}/business/verify`
      : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata, ...(emailRedirectTo && { emailRedirectTo }) },
    });
    if (error) {
      log('signUp error:', error.message);
      return { error: new Error(error.message) };
    }
    // Supabase returns success with empty identities[] when the email is already registered
    // (anti-enumeration). Detect this and surface a clear error.
    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      log('signUp: email already registered');
      return {
        error: new Error('This email is already registered. Please sign in instead.'),
        alreadyExists: true,
      };
    }
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    if (DEV_MODE) return { error: null };
    log('signIn:', email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) log('signIn error:', error.message);
    return { error: error ? new Error(error.message) : null };
  };

  const signInWithMagicLink = async (email: string) => {
    if (DEV_MODE) return { error: null };
    log('magicLink:', email);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) log('magicLink error:', error.message);
    return { error: error ? new Error(error.message) : null };
  };

  const signInWithProvider = async (provider: 'google' | 'apple') => {
    if (DEV_MODE) return { error: null };
    log('signInWithProvider:', provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) log('signInWithProvider error:', error.message);
    return { error: error ? new Error(error.message) : null };
  };

  const resendConfirmation = async (email: string) => {
    if (DEV_MODE) return { error: null };
    log('resendConfirmation:', email);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) log('resendConfirmation error:', error.message);
    return { error: error ? new Error(error.message) : null };
  };

  const resetPassword = async (email: string) => {
    if (DEV_MODE) return { error: null };
    log('resetPassword:', email);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) log('resetPassword error:', error.message);
    return { error: error ? new Error(error.message) : null };
  };

  const updatePassword = async (password: string) => {
    if (DEV_MODE) return { error: null };
    log('updatePassword');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) log('updatePassword error:', error.message);
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    if (DEV_MODE) return;
    log('Signing out');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const value: AuthContextType = {
    user,
    profile,
    business,
    isBusinessApproved: business?.status === 'approved',
    session,
    isLoading,
    isAuthenticated: DEV_MODE || !!user,
    isProfileComplete: checkProfileComplete(profile),
    signUp,
    signIn,
    signInWithMagicLink,
    signInWithProvider,
    resendConfirmation,
    resetPassword,
    updatePassword,
    signOut,
    refreshProfile,
    refreshBusiness,
  };

  log('State:', { isLoading, auth: !!user, profile: !!profile, name: profile?.first_name || null });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
