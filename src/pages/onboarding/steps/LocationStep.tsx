import { GradientButton } from '../../../components/ui';
import { MapPin, CheckCircle } from 'lucide-react';

interface LocationStepProps {
  locationPermission: 'prompt' | 'granted' | 'denied';
  locationName: string | null;
  locationNameLoading: boolean;
  locationVibe: string;
  onEnableLocation: () => void;
}

export function LocationStep({
  locationPermission,
  locationName,
  locationNameLoading,
  locationVibe,
  onEnableLocation,
}: LocationStepProps) {
  if (locationPermission === 'granted') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        {locationNameLoading ? (
          <>
            <h1 className="text-2xl font-bold gradient-text mb-2">Finding your location...</h1>
            <div className="mt-4 p-4 bg-blue/5 rounded-xl border border-blue/20">
              <div className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4 text-blue animate-pulse" />
                <div className="h-5 w-36 bg-border rounded-full animate-shimmer" />
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold gradient-text mb-2">Location enabled</h1>
            <div className="mt-4 p-4 bg-blue/5 rounded-xl border border-blue/20">
              <div className="flex items-center justify-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-blue" />
                <span className="font-semibold text-text">{locationName || 'Location found'}</span>
              </div>
              <p className="text-sm text-text-muted">{locationVibe}</p>
            </div>
          </>
        )}
      </div>
    );
  }

  if (locationPermission === 'denied') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold gradient-text mb-2">Location not enabled</h1>
        <p className="text-text-muted mb-6">
          Lincc works best with your location. Without it, you'll miss events happening right around you.
        </p>
        <GradientButton onClick={onEnableLocation} fullWidth>
          <MapPin className="h-4 w-4 mr-2" />
          Try Again
        </GradientButton>
        <p className="text-xs text-text-light mt-3">
          If your browser blocked the request, you may need to allow location access in your browser settings and try again
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
        <MapPin className="h-8 w-8 text-white" />
      </div>
      <h1 className="text-2xl font-bold gradient-text mb-2">Enable your location</h1>
      <p className="text-text-muted mb-8">
        Lincc needs your location to find events, people, and things to do near you. Without it, you'll miss out on what's happening in your area.
      </p>
      <GradientButton onClick={onEnableLocation} fullWidth>
        <MapPin className="h-4 w-4 mr-2" />
        Allow Location Access
      </GradientButton>
      <p className="text-xs text-text-light mt-3">
        You can change this anytime in Settings
      </p>
    </div>
  );
}
