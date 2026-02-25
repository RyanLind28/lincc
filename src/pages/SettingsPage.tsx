import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Header } from '../components/layout';
import { Slider } from '../components/ui';
import { LogOut, Ghost, Users, MapPin, Download, Trash2, ChevronRight, Bell, UserPlus, MessageCircle, AlertCircle, Clock, Moon } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { cn } from '../lib/utils';
import type { NotificationPreferences } from '../types';

export default function SettingsPage() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const { permission, isSubscribed, isLoading: isPushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();

  const defaultPrefs: NotificationPreferences = {
    join_request: true,
    request_approved: true,
    request_declined: true,
    new_message: true,
    event_cancelled: true,
    event_starting: true,
    nearby_event: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
  };

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(
    () => ({ ...defaultPrefs, ...(profile?.notification_preferences || {}) })
  );

  const updateNotifPref = useCallback(async (key: keyof NotificationPreferences, value: boolean | string) => {
    if (!user?.id) return;
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);

    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: updated })
      .eq('id', user.id);

    if (error) {
      showToast('Failed to update preference', 'error');
      setNotifPrefs(notifPrefs);
    }
  }, [user?.id, notifPrefs, showToast]);

  const [isGhostMode, setIsGhostMode] = useState(profile?.is_ghost_mode || false);
  const [isWomenOnlyMode, setIsWomenOnlyMode] = useState(profile?.is_women_only_mode || false);
  const [radius, setRadius] = useState(profile?.settings_radius || 10);

  const handleToggleGhostMode = async () => {
    if (!user?.id) return;
    const newValue = !isGhostMode;
    setIsGhostMode(newValue);

    const { error } = await supabase
      .from('profiles')
      .update({ is_ghost_mode: newValue })
      .eq('id', user.id);

    if (error) {
      showToast('Failed to update setting', 'error');
      setIsGhostMode(!newValue);
    } else {
      await refreshProfile(user.id);
    }
  };

  const handleToggleWomenOnlyMode = async () => {
    if (!user?.id) return;
    const newValue = !isWomenOnlyMode;
    setIsWomenOnlyMode(newValue);

    const { error } = await supabase
      .from('profiles')
      .update({ is_women_only_mode: newValue })
      .eq('id', user.id);

    if (error) {
      showToast('Failed to update setting', 'error');
      setIsWomenOnlyMode(!newValue);
    } else {
      await refreshProfile(user.id);
    }
  };

  const handleRadiusChange = async (newRadius: number) => {
    setRadius(newRadius);

    if (!user?.id) return;
    const { error } = await supabase
      .from('profiles')
      .update({ settings_radius: newRadius })
      .eq('id', user.id);

    if (error) {
      showToast('Failed to update setting', 'error');
    } else {
      await refreshProfile(user.id);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleExportData = () => {
    showToast('Data export feature coming soon', 'info');
  };

  const handleDeleteAccount = () => {
    showToast('Account deletion feature coming soon', 'info');
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header showBack showLogo />

      <div className="p-4 space-y-6">
        {/* Discovery Settings */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3 px-1">
            Discovery
          </h2>
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            {/* Radius */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-coral" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-text">Search Radius</h3>
                </div>
              </div>
              <Slider
                value={radius}
                onChange={handleRadiusChange}
                min={1}
                max={20}
                step={1}
                formatValue={(v) => `${v} km`}
              />
            </div>

            {/* Ghost Mode */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center">
                <Ghost className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Ghost Mode</h3>
                <p className="text-sm text-text-muted">Hide your profile temporarily</p>
              </div>
              <button
                onClick={handleToggleGhostMode}
                className={cn(
                  'relative w-12 h-7 rounded-full transition-colors',
                  isGhostMode ? 'bg-coral' : 'bg-gray-200'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform',
                    isGhostMode ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {/* Women Only Mode - only show for women */}
            {profile?.gender === 'female' && (
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple/10 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-text">Women-Only Mode</h3>
                  <p className="text-sm text-text-muted">Only see women-hosted events</p>
                </div>
                <button
                  onClick={handleToggleWomenOnlyMode}
                  className={cn(
                    'relative w-12 h-7 rounded-full transition-colors',
                    isWomenOnlyMode ? 'bg-coral' : 'bg-gray-200'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform',
                      isWomenOnlyMode ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Notifications */}
        {'Notification' in window && 'PushManager' in window && (
          <section>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3 px-1">
              Notifications
            </h2>
            <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
              {/* Master push toggle */}
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center">
                  <Bell className="h-5 w-5 text-coral" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-text">Push Notifications</h3>
                  {permission === 'denied' ? (
                    <p className="text-sm text-text-muted">Blocked in browser settings</p>
                  ) : (
                    <p className="text-sm text-text-muted">Get notified about events and messages</p>
                  )}
                </div>
                {permission !== 'denied' && (
                  <button
                    onClick={isSubscribed ? pushUnsubscribe : pushSubscribe}
                    disabled={isPushLoading}
                    className={cn(
                      'relative w-12 h-7 rounded-full transition-colors',
                      isPushLoading && 'opacity-50',
                      isSubscribed ? 'bg-coral' : 'bg-gray-200'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform',
                        isSubscribed ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                )}
              </div>

              {/* Per-type toggles — only show when subscribed */}
              {isSubscribed && (
                <>
                  {/* Join Requests */}
                  <div className="p-4 pl-8 flex items-center gap-3">
                    <div className="w-8 h-8 bg-coral/10 rounded-lg flex items-center justify-center">
                      <UserPlus className="h-4 w-4 text-coral" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-text">Join Requests</h3>
                      <p className="text-xs text-text-muted">When someone wants to join your event</p>
                    </div>
                    <button
                      onClick={() => updateNotifPref('join_request', !notifPrefs.join_request)}
                      className={cn(
                        'relative w-11 h-6 rounded-full transition-colors',
                        notifPrefs.join_request ? 'bg-coral' : 'bg-gray-200'
                      )}
                    >
                      <span className={cn(
                        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                        notifPrefs.join_request ? 'translate-x-5.5' : 'translate-x-0.5'
                      )} />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="p-4 pl-8 flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple/10 rounded-lg flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-purple" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-text">Messages</h3>
                      <p className="text-xs text-text-muted">New messages in event chats</p>
                    </div>
                    <button
                      onClick={() => updateNotifPref('new_message', !notifPrefs.new_message)}
                      className={cn(
                        'relative w-11 h-6 rounded-full transition-colors',
                        notifPrefs.new_message ? 'bg-coral' : 'bg-gray-200'
                      )}
                    >
                      <span className={cn(
                        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                        notifPrefs.new_message ? 'translate-x-5.5' : 'translate-x-0.5'
                      )} />
                    </button>
                  </div>

                  {/* Event Reminders */}
                  <div className="p-4 pl-8 flex items-center gap-3">
                    <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                      <Clock className="h-4 w-4 text-warning" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-text">Event Reminders</h3>
                      <p className="text-xs text-text-muted">Reminders before events start</p>
                    </div>
                    <button
                      onClick={() => updateNotifPref('event_starting', !notifPrefs.event_starting)}
                      className={cn(
                        'relative w-11 h-6 rounded-full transition-colors',
                        notifPrefs.event_starting ? 'bg-coral' : 'bg-gray-200'
                      )}
                    >
                      <span className={cn(
                        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                        notifPrefs.event_starting ? 'translate-x-5.5' : 'translate-x-0.5'
                      )} />
                    </button>
                  </div>

                  {/* Event Cancellations */}
                  <div className="p-4 pl-8 flex items-center gap-3">
                    <div className="w-8 h-8 bg-error/10 rounded-lg flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-error" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-text">Cancellations</h3>
                      <p className="text-xs text-text-muted">When an event you joined is cancelled</p>
                    </div>
                    <button
                      onClick={() => updateNotifPref('event_cancelled', !notifPrefs.event_cancelled)}
                      className={cn(
                        'relative w-11 h-6 rounded-full transition-colors',
                        notifPrefs.event_cancelled ? 'bg-coral' : 'bg-gray-200'
                      )}
                    >
                      <span className={cn(
                        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                        notifPrefs.event_cancelled ? 'translate-x-5.5' : 'translate-x-0.5'
                      )} />
                    </button>
                  </div>

                  {/* Nearby Events */}
                  <div className="p-4 pl-8 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue/10 rounded-lg flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-blue" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-text">Nearby Events</h3>
                      <p className="text-xs text-text-muted">When a new event is posted near you</p>
                    </div>
                    <button
                      onClick={() => updateNotifPref('nearby_event', !notifPrefs.nearby_event)}
                      className={cn(
                        'relative w-11 h-6 rounded-full transition-colors',
                        notifPrefs.nearby_event ? 'bg-coral' : 'bg-gray-200'
                      )}
                    >
                      <span className={cn(
                        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                        notifPrefs.nearby_event ? 'translate-x-5.5' : 'translate-x-0.5'
                      )} />
                    </button>
                  </div>

                  {/* Quiet Hours */}
                  <div className="p-4 pl-8">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple/10 rounded-lg flex items-center justify-center">
                        <Moon className="h-4 w-4 text-purple" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-text">Quiet Hours</h3>
                        <p className="text-xs text-text-muted">Silence push notifications during set times</p>
                      </div>
                      <button
                        onClick={() => updateNotifPref('quiet_hours_enabled', !notifPrefs.quiet_hours_enabled)}
                        className={cn(
                          'relative w-11 h-6 rounded-full transition-colors',
                          notifPrefs.quiet_hours_enabled ? 'bg-coral' : 'bg-gray-200'
                        )}
                      >
                        <span className={cn(
                          'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                          notifPrefs.quiet_hours_enabled ? 'translate-x-5.5' : 'translate-x-0.5'
                        )} />
                      </button>
                    </div>
                    {notifPrefs.quiet_hours_enabled && (
                      <div className="mt-3 ml-11 flex items-center gap-2">
                        <input
                          type="time"
                          value={notifPrefs.quiet_hours_start}
                          onChange={(e) => updateNotifPref('quiet_hours_start', e.target.value)}
                          className="px-2 py-1 text-sm bg-background border border-border rounded-lg text-text"
                        />
                        <span className="text-sm text-text-muted">to</span>
                        <input
                          type="time"
                          value={notifPrefs.quiet_hours_end}
                          onChange={(e) => updateNotifPref('quiet_hours_end', e.target.value)}
                          className="px-2 py-1 text-sm bg-background border border-border rounded-lg text-text"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* Account Settings */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3 px-1">
            Account
          </h2>
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            <button
              onClick={handleExportData}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Download className="h-5 w-5 text-text-muted" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Export My Data</h3>
                <p className="text-sm text-text-muted">Download all your data</p>
              </div>
              <ChevronRight className="h-5 w-5 text-text-muted" />
            </button>

            <button
              onClick={handleDeleteAccount}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-error/10 rounded-xl flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-error" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-error">Delete Account</h3>
                <p className="text-sm text-text-muted">Permanently delete your account</p>
              </div>
              <ChevronRight className="h-5 w-5 text-text-muted" />
            </button>
          </div>
        </section>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full p-4 flex items-center justify-center gap-2 bg-surface rounded-2xl border border-border text-text-muted hover:text-text hover:border-coral transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sign Out</span>
        </button>

        {/* Version */}
        <p className="text-center text-sm text-text-light">
          Lincc v0.1.0
        </p>
      </div>
    </div>
  );
}
