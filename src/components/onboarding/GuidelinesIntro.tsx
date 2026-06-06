import { GradientButton } from '../ui';
import { personalGuidelines, businessGuidelines } from '../../data/guidelines';
import { OnboardingHelpButton } from './OnboardingHelpButton';

const LOGO_URL = 'https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp';

interface GuidelinesIntroProps {
  variant: 'personal' | 'business';
  onContinue: () => void;
}

// Standalone intro screen shown at the start of onboarding. Terms are accepted
// at signup, so this is an acknowledgement of how to behave on Lincc rather than
// a legal gate — hence no checkbox, just a Continue button.
export function GuidelinesIntro({ variant, onContinue }: GuidelinesIntroProps) {
  const isBusiness = variant === 'business';
  const items = isBusiness ? businessGuidelines : personalGuidelines;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-coral/5 to-purple/5 blur-3xl pointer-events-none" />
      <OnboardingHelpButton source={`guidelines-${variant}`} className="absolute top-4 right-4 z-20 safe-top" />
      <div className="w-full max-w-sm relative">
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
                ? 'A few things we ask of every business on Lincc.'
                : 'A few things we ask of everyone on Lincc.'}
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

          <GradientButton onClick={onContinue} fullWidth>
            Continue
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
