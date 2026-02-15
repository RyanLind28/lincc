import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui';
import { Shield, Users, Clock, Heart } from 'lucide-react';

const guidelines = [
  {
    icon: Shield,
    title: 'Safety First',
    description: 'Always meet in public places. Trust your instincts and report any suspicious behavior.',
  },
  {
    icon: Users,
    title: 'Respectful Interactions',
    description: 'Treat everyone with respect. Harassment, discrimination, and inappropriate behavior are not tolerated.',
  },
  {
    icon: Clock,
    title: 'Be Reliable',
    description: 'Honor your commitments. If you can\'t make it, let others know as soon as possible.',
  },
  {
    icon: Heart,
    title: 'Platonic Connections',
    description: 'Lincc is for friendship and activity partners. This is not a dating app.',
  },
];

export default function TermsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

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

    // Use upsert so it works whether the profile row exists or not
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
      showToast('Something went wrong. Please try again.', 'error');
      console.error(error);
    } else {
      await refreshProfile(user.id);
      navigate('/onboarding');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text mb-2">Community Guidelines</h1>
          <p className="text-text-muted">
            Before you get started, please review and agree to our community guidelines.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {guidelines.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 p-4 bg-surface rounded-xl border border-border"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <item.icon className="h-5 w-5 text-primary" />
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
            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-sm text-text">
            I agree to follow the community guidelines and understand that violations may result in account suspension.
          </span>
        </label>

        <Button
          onClick={handleAccept}
          className="w-full"
          isLoading={isLoading}
          disabled={!agreed}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
