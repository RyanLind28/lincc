import { logger } from '../../lib/utils';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { GradientButton } from '../../components/ui';
import { personalGuidelines, businessGuidelines } from '../../data/guidelines';

const LOGO_URL = 'https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp';

export default function TermsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isBusiness = profile?.account_type === 'business';
  const items = isBusiness ? businessGuidelines : personalGuidelines;

  // If terms already accepted, skip this page
  useEffect(() => {
    if (profile?.terms_accepted_at) {
      navigate(profile.first_name ? '/' : '/onboarding', { replace: true });
    }
  }, [profile, navigate]);

  const handleAccept = async () => {
    if (!agreed) {
      showToast('Please agree to the community guidelines', 'error');
      return;
    }

    if (!user?.id || !user?.email) {
      showToast('Please sign in first', 'error');
      return;
    }

    setIsLoading(true);

    // Use upsert so it works whether the profile row exists or not.
    const { error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email as string,
          terms_accepted_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      // logger.error is a no-op in production, so report to Sentry to make this
      // failure visible — previously the user only ever saw a generic toast and
      // the underlying cause was recorded nowhere.
      Sentry.captureException(error, {
        tags: { feature: 'terms-accept' },
        extra: { userId: user.id, code: error.code, details: error.details, hint: error.hint },
      });
      showToast('Something went wrong. Please try again.', 'error');
      logger.error(error);
    } else {
      await refreshProfile(user.id);
      navigate('/onboarding');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-coral/5 to-purple/5 blur-3xl pointer-events-none" />
      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={LOGO_URL} alt="Lincc" className="h-8" />
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold gradient-text mb-2">
              {isBusiness ? 'Business Guidelines' : 'Community Guidelines'}
            </h1>
            <p className="text-text-muted">
              {isBusiness
                ? 'Before you list your business, please review and agree to our guidelines.'
                : 'Before you get started, please review and agree to our community guidelines.'}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div
                key={item.title}
                className="flex gap-4 p-4 bg-background rounded-xl border border-border"
              >
                <div className="flex-shrink-0 w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-text mb-1">{item.title}</h3>
                  <p className="text-sm text-text-muted">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-coral focus:ring-coral"
            />
            <span className="text-sm text-text">
              I agree to follow the community guidelines and understand that violations may result in account suspension.
            </span>
          </label>

          <GradientButton
            onClick={handleAccept}
            fullWidth
            isLoading={isLoading}
            disabled={!agreed}
          >
            Continue
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
