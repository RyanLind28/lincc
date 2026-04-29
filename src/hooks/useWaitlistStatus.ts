import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface WaitlistStatus {
  onWaitlist: boolean;
  joinedAt: string | null;
}

/**
 * Returns whether the current signed-in user was on the waitlist.
 * Matches on their auth email (same email used at landing-page signup → at app signup).
 * Silent failure — if RLS blocks or migration hasn't run, just returns onWaitlist=false.
 */
export function useWaitlistStatus(): WaitlistStatus & { isLoading: boolean } {
  const { user } = useAuth();
  const [status, setStatus] = useState<WaitlistStatus>({
    onWaitlist: false,
    joinedAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!user?.email) {
      setIsLoading(false);
      return;
    }

    supabase
      .from('waitlist')
      .select('created_at')
      .eq('email', user.email)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setStatus({
            onWaitlist: true,
            joinedAt: data.created_at,
          });
        }
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  return { ...status, isLoading };
}
