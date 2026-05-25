import { Bell, CheckCircle } from 'lucide-react';

interface NotificationStepProps {
  pushPermission: string;
  notifToggled: boolean;
  onEnableNotifications: () => void;
}

export function NotificationStep({
  pushPermission,
  notifToggled,
  onEnableNotifications,
}: NotificationStepProps) {
  const notifEnabled = pushPermission === 'granted' || notifToggled;

  return (
    <div className="text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 ${
        notifEnabled ? 'bg-success/10 animate-scale-in' : 'gradient-primary'
      }`}>
        {notifEnabled ? (
          <CheckCircle className="h-8 w-8 text-success" />
        ) : (
          <Bell className="h-8 w-8 text-white" />
        )}
      </div>

      {notifEnabled ? (
        <>
          <h1 className="text-2xl font-bold gradient-text mb-2">Notifications enabled</h1>
          <p className="text-text-muted">
            You'll be the first to know when something's happening near you.
          </p>
        </>
      ) : 'Notification' in window ? (
        <>
          <h1 className="text-2xl font-bold gradient-text mb-2">Don't miss out</h1>
          <p className="text-text-muted mb-8">
            People are posting events all the time. Turn on notifications so you're the first to know when something pops up nearby.
          </p>

          <button
            onClick={onEnableNotifications}
            className="w-full p-5 bg-purple/5 rounded-2xl border border-purple/20 flex items-center gap-4 hover:bg-purple/10 transition-colors text-left press-effect"
          >
            <div className="w-12 h-12 bg-purple rounded-xl flex items-center justify-center flex-shrink-0">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text">Turn on notifications</h3>
              <p className="text-xs text-text-muted mt-0.5">Your browser will ask for permission</p>
            </div>
            <div className="w-12 h-7 bg-border rounded-full flex items-center px-0.5 flex-shrink-0">
              <div className="w-6 h-6 bg-white rounded-full shadow-sm" />
            </div>
          </button>

          <p className="text-xs text-text-light mt-3">
            You can change this anytime in Settings
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold gradient-text mb-2">You're all set!</h1>
          <p className="text-text-muted">
            Notifications aren't supported on this browser, but you can check Lincc anytime to see what's happening.
          </p>
        </>
      )}
    </div>
  );
}
