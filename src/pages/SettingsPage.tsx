import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Header } from '../components/layout';
import { Slider, Toggle, Modal, Input, Button } from '../components/ui';
import { LogOut, Users, MapPin, Download, Trash2, ChevronRight, Bell, UserPlus, MessageCircle, AlertCircle, Clock, Moon, CheckCircle, XCircle, Tag, Loader2, Store, Building2, Edit2, Monitor } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useUserLocation } from '../hooks/useUserLocation';
import { useLocationName } from '../hooks/useLocationName';
import { BusinessOnboardingSheet } from '../components/business/BusinessOnboardingSheet';
import { deactivateBusinessProfile } from '../services/businessService';
import type { NotificationPreferences } from '../types';

export default function SettingsPage() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { location } = useUserLocation();

  const { permission, isSubscribed, isLoading: isPushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();
  const { locationName, isLoading: locationLoading } = useLocationName(location);

  const [showBusinessOnboarding, setShowBusinessOnboarding] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeactivateBusiness = async () => {
    if (!user?.id) return;
    setIsDeactivating(true);
    const result = await deactivateBusinessProfile(user.id);
    if (result.success) {
      await refreshProfile(user.id);
      showToast('Switched back to personal mode', 'success');
    } else {
      showToast(result.error || 'Failed to deactivate', 'error');
    }
    setIsDeactivating(false);
  };

  const defaultPrefs: NotificationPreferences = {
    join_request: true,
    request_approved: true,
    request_declined: true,
    new_message: true,
    event_cancelled: true,
    event_starting: true,
    nearby_event: true,
    voucher_shared: true,
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
  };

  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(
    () => ({ ...defaultPrefs, ...(profile?.notification_preferences || {}) })
  );

  // The boolean pref keys (excluding quiet_hours_start/end which are strings)
  const booleanPrefKeys: (keyof NotificationPreferences)[] = [
    'join_request', 'request_approved', 'request_declined',
    'new_message', 'event_cancelled', 'event_starting',
    'nearby_event', 'voucher_shared',
  ];

  const allOn = booleanPrefKeys.every((k) => notifPrefs[k] === true);

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

  const handleToggleAll = useCallback(async () => {
    if (!user?.id) return;
    const newValue = !allOn;
    const updated = { ...notifPrefs };
    for (const key of booleanPrefKeys) {
      (updated as Record<string, unknown>)[key] = newValue;
    }
    setNotifPrefs(updated as NotificationPreferences);

    // Also toggle push subscription to match
    if (newValue && !isSubscribed && permission !== 'denied') {
      pushSubscribe();
    } else if (!newValue && isSubscribed) {
      pushUnsubscribe();
    }

    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: updated })
      .eq('id', user.id);

    if (error) {
      showToast('Failed to update preferences', 'error');
      setNotifPrefs(notifPrefs);
    }
  }, [user?.id, notifPrefs, allOn, isSubscribed, permission, pushSubscribe, pushUnsubscribe, showToast]);

  const [isWomenOnlyMode, setIsWomenOnlyMode] = useState(profile?.is_women_only_mode || false);
  const [radius, setRadius] = useState(profile?.settings_radius || 10);

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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE' || !user?.id) return;
    setIsDeleting(true);

    const { error } = await supabase.rpc('delete_user_account', { target_user_id: user.id });

    if (error) {
      showToast(error.message || 'Failed to delete account', 'error');
      setIsDeleting(false);
    } else {
      await signOut();
      navigate('/landing');
    }
  };

  const handleSignOutEverywhere = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    navigate('/login');
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
            {/* Location */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-blue" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Your Location</h3>
                {locationLoading ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Loader2 className="h-3 w-3 animate-spin text-text-muted" />
                    <p className="text-sm text-text-muted">Detecting location...</p>
                  </div>
                ) : locationName ? (
                  <p className="text-sm text-text-muted">{locationName}</p>
                ) : (
                  <p className="text-sm text-text-muted">Location unavailable</p>
                )}
              </div>
            </div>

            {/* Radius */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center flex-shrink-0">
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

            {/* Women Only Mode - only show for women */}
            {profile?.gender === 'female' && (
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-purple" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-text">Women-Only Mode</h3>
                  <p className="text-sm text-text-muted">Only see women-hosted events</p>
                </div>
                <Toggle checked={isWomenOnlyMode} onChange={handleToggleWomenOnlyMode} />
              </div>
            )}
          </div>
        </section>

        {/* Business */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3 px-1">
            Business
          </h2>
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            {!profile?.is_business ? (
              <button
                onClick={() => setShowBusinessOnboarding(true)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store className="h-5 w-5 text-coral" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-text">Switch to Business</h3>
                  <p className="text-sm text-text-muted">Create vouchers and promote your business</p>
                </div>
                <ChevronRight className="h-5 w-5 text-text-muted" />
              </button>
            ) : (
              <>
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-text">{profile.business_name || 'Business Mode'}</h3>
                    <p className="text-sm text-green-500 font-medium">Active</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/business/edit')}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Edit2 className="h-5 w-5 text-purple" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-text">Edit Business Profile</h3>
                    <p className="text-sm text-text-muted">Update your business details</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-text-muted" />
                </button>
                <button
                  onClick={handleDeactivateBusiness}
                  disabled={isDeactivating}
                  className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-error/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    {isDeactivating ? (
                      <Loader2 className="h-5 w-5 text-error animate-spin" />
                    ) : (
                      <Store className="h-5 w-5 text-error" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-error">Deactivate Business</h3>
                    <p className="text-sm text-text-muted">Switch back to personal mode</p>
                  </div>
                </button>
              </>
            )}
          </div>
        </section>

        {/* Business Onboarding Sheet */}
        <BusinessOnboardingSheet
          isOpen={showBusinessOnboarding}
          onClose={() => setShowBusinessOnboarding(false)}
        />

        {/* Notifications */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3 px-1">
            Notifications
          </h2>
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            {/* Master toggle — all notifications on/off */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell className="h-5 w-5 text-coral" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">All Notifications</h3>
                <p className="text-sm text-text-muted">Enable or disable all notifications</p>
              </div>
              <Toggle
                checked={allOn}
                onChange={handleToggleAll}
                disabled={isPushLoading}
              />
            </div>

            {/* Join Requests */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserPlus className="h-5 w-5 text-coral" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Join Requests</h3>
                <p className="text-sm text-text-muted">When someone wants to join your event</p>
              </div>
              <Toggle
                checked={notifPrefs.join_request}
                onChange={() => updateNotifPref('join_request', !notifPrefs.join_request)}
              />
            </div>

            {/* Request Approved */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Request Approved</h3>
                <p className="text-sm text-text-muted">When a host approves your join request</p>
              </div>
              <Toggle
                checked={notifPrefs.request_approved}
                onChange={() => updateNotifPref('request_approved', !notifPrefs.request_approved)}
              />
            </div>

            {/* Request Declined */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-error/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <XCircle className="h-5 w-5 text-error" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Request Declined</h3>
                <p className="text-sm text-text-muted">When a host declines your join request</p>
              </div>
              <Toggle
                checked={notifPrefs.request_declined}
                onChange={() => updateNotifPref('request_declined', !notifPrefs.request_declined)}
              />
            </div>

            {/* Messages */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-purple" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Messages</h3>
                <p className="text-sm text-text-muted">New messages in chats</p>
              </div>
              <Toggle
                checked={notifPrefs.new_message}
                onChange={() => updateNotifPref('new_message', !notifPrefs.new_message)}
              />
            </div>

            {/* Event Reminders */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Event Reminders</h3>
                <p className="text-sm text-text-muted">Reminders before events start</p>
              </div>
              <Toggle
                checked={notifPrefs.event_starting}
                onChange={() => updateNotifPref('event_starting', !notifPrefs.event_starting)}
              />
            </div>

            {/* Event Cancellations */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-error/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-error" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Cancellations</h3>
                <p className="text-sm text-text-muted">When an event you joined is cancelled</p>
              </div>
              <Toggle
                checked={notifPrefs.event_cancelled}
                onChange={() => updateNotifPref('event_cancelled', !notifPrefs.event_cancelled)}
              />
            </div>

            {/* Nearby Events */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-blue" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Nearby Events</h3>
                <p className="text-sm text-text-muted">When a new event is posted near you</p>
              </div>
              <Toggle
                checked={notifPrefs.nearby_event}
                onChange={() => updateNotifPref('nearby_event', !notifPrefs.nearby_event)}
              />
            </div>

            {/* Voucher Shares */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Tag className="h-5 w-5 text-coral" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Shared Vouchers</h3>
                <p className="text-sm text-text-muted">When a friend shares a voucher with you</p>
              </div>
              <Toggle
                checked={notifPrefs.voucher_shared}
                onChange={() => updateNotifPref('voucher_shared', !notifPrefs.voucher_shared)}
              />
            </div>

            {/* Quiet Hours */}
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Moon className="h-5 w-5 text-purple" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-text">Quiet Hours</h3>
                  <p className="text-sm text-text-muted">Silence notifications during set times</p>
                </div>
                <Toggle
                  checked={notifPrefs.quiet_hours_enabled}
                  onChange={() => updateNotifPref('quiet_hours_enabled', !notifPrefs.quiet_hours_enabled)}
                />
              </div>
              {notifPrefs.quiet_hours_enabled && (
                <div className="mt-3 ml-13 flex items-center gap-2">
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
          </div>
        </section>

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
              onClick={() => setShowDeleteModal(true)}
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

        {/* Session */}
        <div className="space-y-3">
          <button
            onClick={handleSignOut}
            className="w-full p-4 flex items-center justify-center gap-2 bg-surface rounded-2xl border border-border text-text-muted hover:text-text hover:border-coral transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign Out</span>
          </button>

          <button
            onClick={handleSignOutEverywhere}
            className="w-full p-4 flex items-center justify-center gap-2 bg-surface rounded-2xl border border-border text-text-muted hover:text-text hover:border-coral transition-colors"
          >
            <Monitor className="h-5 w-5" />
            <span className="font-medium">Sign Out Everywhere</span>
          </button>
        </div>

        {/* Version */}
        <p className="text-center text-sm text-text-light">
          Lincc v0.1.0
        </p>

        {/* Delete Account Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
          title="Delete Account"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-text-muted">
              This action is permanent and cannot be undone. All your data — events, messages, connections — will be permanently deleted.
            </p>
            <Input
              label='Type "DELETE" to confirm'
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
            />
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                isLoading={isDeleting}
              >
                Delete Forever
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
