import { Share, MoreVertical, PlusSquare } from 'lucide-react';
import { getBrowserEnv } from '../../lib/browserEnv';

export type InstallPlatform = 'ios-safari' | 'ios-chromium' | 'android' | 'desktop' | 'unknown';

export interface InstallStep {
  number: number;
  content: React.ReactNode;
}

export interface InstallInstructions {
  tagline: string;
  steps: InstallStep[];
}

export function detectInstallPlatform(): InstallPlatform {
  const env = getBrowserEnv();
  if (env.os === 'iOS') return env.browser === 'safari' ? 'ios-safari' : 'ios-chromium';
  if (env.os === 'Android') return 'android';
  if (env.deviceClass === 'desktop') return 'desktop';
  return 'unknown';
}

const ADD_TO_HOME_STEP: InstallStep = {
  number: 2,
  content: (
    <>
      Tap <span className="font-semibold text-text">Add to Home Screen</span>
      <PlusSquare className="inline h-4 w-4 mx-1.5 text-coral align-text-bottom" />
    </>
  ),
};

export function getInstallInstructions(platform: InstallPlatform): InstallInstructions | null {
  switch (platform) {
    case 'ios-safari':
      return {
        tagline: "Save Lincc to your home screen — it'll open like a native app.",
        steps: [
          {
            number: 1,
            content: (
              <>
                Tap the <Share className="inline h-4 w-4 mx-1.5 text-coral align-text-bottom" />
                <span className="font-semibold text-text">Share</span> button at the bottom of Safari
              </>
            ),
          },
          ADD_TO_HOME_STEP,
        ],
      };
    case 'ios-chromium':
      return {
        tagline: 'Save Lincc to your home screen for the best experience.',
        steps: [
          {
            number: 1,
            content: (
              <>
                Open this page in <span className="font-semibold text-text">Safari</span> first — Chrome on iPhone can&apos;t install web apps directly
              </>
            ),
          },
          {
            number: 2,
            content: (
              <>
                Tap <Share className="inline h-4 w-4 mx-1.5 text-coral align-text-bottom" />
                <span className="font-semibold text-text">Share</span>, then <span className="font-semibold text-text">Add to Home Screen</span>
              </>
            ),
          },
        ],
      };
    case 'android':
      return {
        tagline: "Save Lincc to your home screen — it'll open like a native app.",
        steps: [
          {
            number: 1,
            content: (
              <>
                Tap the <MoreVertical className="inline h-4 w-4 mx-1.5 text-coral align-text-bottom" />
                <span className="font-semibold text-text">menu</span> in your browser&apos;s address bar
              </>
            ),
          },
          {
            number: 2,
            content: (
              <>
                Tap <span className="font-semibold text-text">Install app</span> or <span className="font-semibold text-text">Add to Home Screen</span>
              </>
            ),
          },
        ],
      };
    default:
      return null;
  }
}

export function InstallSteps({ steps }: { steps: InstallStep[] }) {
  return (
    <ol className="space-y-2 text-sm text-text-muted">
      {steps.map((step) => (
        <li key={step.number} className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-coral text-white text-xs font-bold shrink-0 mt-0.5">
            {step.number}
          </span>
          <span className="leading-relaxed">{step.content}</span>
        </li>
      ))}
    </ol>
  );
}
