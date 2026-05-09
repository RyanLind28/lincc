import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const GUIDE_DISMISSED_KEY = 'lincc-welcome-guide-dismissed';

const steps = [
  {
    target: 'discover',
    title: 'Discover events',
    description: 'Browse events happening near you. Tap to switch between list and map view.',
  },
  {
    target: 'create-event',
    title: 'Create an event',
    description: 'Tap here to post your own event in under 30 seconds.',
  },
  {
    target: 'chats',
    title: 'Your chats',
    description: 'Chat with event hosts and participants in real time.',
  },
  {
    target: 'my-events',
    title: 'Your events',
    description: 'See events you\'re hosting or attending, all in one place.',
  },
];

type Position = 'top' | 'bottom' | 'right';

export function WelcomeGuide() {
  const { user, profile, refreshProfile } = useAuth();
  // Verified/onboarded users never see tooltips again — gated on the DB-backed
  // welcomed_at flag rather than localStorage alone, so the guide stays dismissed
  // across devices and after clearing browser data.
  const isWelcomed = Boolean(profile?.welcomed_at);
  const [dismissed, setDismissed] = useState(() =>
    isWelcomed || localStorage.getItem(GUIDE_DISMISSED_KEY) === 'true'
  );
  useEffect(() => {
    if (isWelcomed) setDismissed(true);
  }, [isWelcomed]);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [position, setPosition] = useState<Position>('top');
  const tooltipRef = useRef<HTMLDivElement>(null);

  const isDesktop = () => window.innerWidth >= 1024;

  const positionTooltip = useCallback(() => {
    const step = steps[currentStep];
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const padding = 6;
    const gap = 12;
    const tooltipWidth = isDesktop() ? 280 : 260;

    // Spotlight around target element
    setSpotlightStyle({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      borderRadius: '12px',
    });

    // Determine position based on layout
    let pos: Position;
    if (isDesktop()) {
      // Desktop: sidebar is on the left, tooltip goes to the right
      pos = 'right';
    } else {
      // Mobile: bottom nav is at the bottom, tooltip goes above
      // Header create button → tooltip goes below
      pos = rect.top < 100 ? 'bottom' : 'top';
    }
    setPosition(pos);

    if (pos === 'right') {
      // Position to the right of the sidebar element
      const top = rect.top + rect.height / 2 - 50; // roughly center vertically
      const left = rect.right + padding + gap;

      setTooltipStyle({
        top: Math.max(12, Math.min(top, window.innerHeight - 180)),
        left,
        width: tooltipWidth,
      });

      // Arrow pointing left toward the element
      const arrowTop = rect.top + rect.height / 2 - (Math.max(12, Math.min(top, window.innerHeight - 180))) - 6;
      setArrowStyle({
        top: Math.max(16, Math.min(arrowTop, 80)),
      });
    } else {
      // Mobile: position above or below
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      if (left < 12) left = 12;
      if (left + tooltipWidth > window.innerWidth - 12) left = window.innerWidth - 12 - tooltipWidth;

      if (pos === 'top') {
        const bottom = window.innerHeight - rect.top + padding + gap;
        setTooltipStyle({ bottom, left, width: tooltipWidth });
      } else {
        const top = rect.bottom + padding + gap;
        setTooltipStyle({ top, left, width: tooltipWidth });
      }

      // Arrow pointing toward the element
      const arrowLeft = rect.left + rect.width / 2 - left - 6;
      setArrowStyle({
        left: Math.max(16, Math.min(arrowLeft, tooltipWidth - 16)),
      });
    }
  }, [currentStep]);

  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(positionTooltip, 300);
    window.addEventListener('resize', positionTooltip);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', positionTooltip);
    };
  }, [dismissed, positionTooltip]);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(GUIDE_DISMISSED_KEY, 'true');
    // Persist to DB so verified users on a new device or after clearing
    // browser storage don't see the guide again.
    if (user?.id && !profile?.welcomed_at) {
      supabase
        .from('profiles')
        .update({ welcomed_at: new Date().toISOString() })
        .eq('id', user.id)
        .then(({ error }) => {
          if (!error) refreshProfile(user.id);
        });
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleDismiss();
    }
  };

  const step = steps[currentStep];

  // Arrow classes per position
  const arrowClasses: Record<Position, string> = {
    top: 'bottom-[-7px] border-r border-b',
    bottom: 'top-[-7px] border-l border-t',
    right: 'left-[-7px] border-l border-b',
  };

  return (
    <>
      {/* Overlay with spotlight cutout */}
      <div
        className="fixed inset-0 z-[60] transition-opacity duration-300"
        onClick={handleNext}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div
          className="absolute transition-all duration-300 ease-out"
          style={{
            ...spotlightStyle,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)',
            background: 'transparent',
            zIndex: 1,
          }}
        />
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[61] animate-slide-up"
        style={tooltipStyle}
      >
        <div className="bg-surface rounded-xl border border-border shadow-xl p-4 relative">
          {/* Arrow */}
          <div
            className={`absolute w-3 h-3 bg-surface border-border rotate-45 ${arrowClasses[position]}`}
            style={arrowStyle}
          />

          {/* Close button */}
          <button
            onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
            className="absolute top-2 right-2 p-1 text-text-light hover:text-text rounded-lg"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {/* Content */}
          <h3 className="font-semibold text-text text-sm pr-6">{step.title}</h3>
          <p className="text-text-muted text-xs mt-1 leading-relaxed">{step.description}</p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStep ? 'w-4 gradient-primary' : 'w-1.5 bg-muted'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="text-xs font-semibold text-coral hover:text-coral-dark transition-colors"
            >
              {currentStep < steps.length - 1 ? 'Next' : 'Got it'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
