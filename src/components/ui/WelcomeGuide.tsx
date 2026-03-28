import { useState } from 'react';
import { X, MapPin, Plus, MessageCircle, Bookmark } from 'lucide-react';
import { GradientButton } from './GradientButton';

const GUIDE_DISMISSED_KEY = 'lincc-welcome-guide-dismissed';

const steps = [
  {
    icon: MapPin,
    title: 'Discover nearby events',
    description: 'Browse events happening around you right now. Switch between list and map view.',
  },
  {
    icon: Plus,
    title: 'Create your own event',
    description: 'Hosting something? Tap the + button to post an event in under 30 seconds.',
  },
  {
    icon: MessageCircle,
    title: 'Chat with participants',
    description: 'Once you join an event, chat with the host and other participants in real time.',
  },
  {
    icon: Bookmark,
    title: 'Save for later',
    description: 'Bookmark events you\'re interested in to check back later.',
  },
];

export function WelcomeGuide() {
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem(GUIDE_DISMISSED_KEY) === 'true'
  );
  const [currentStep, setCurrentStep] = useState(0);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(GUIDE_DISMISSED_KEY, 'true');
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in p-4">
      <div className="bg-surface rounded-2xl border border-border shadow-xl max-w-sm w-full p-6 animate-slide-up">
        <div className="flex justify-end mb-2">
          <button onClick={handleDismiss} className="p-1 text-text-light hover:text-text">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-text mb-2">{step.title}</h2>
          <p className="text-text-muted">{step.description}</p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep ? 'w-6 gradient-primary' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <GradientButton variant="outline" onClick={handleDismiss} fullWidth>
            Skip
          </GradientButton>
          <GradientButton onClick={handleNext} fullWidth>
            {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
          </GradientButton>
        </div>
      </div>
    </div>
  );
}
