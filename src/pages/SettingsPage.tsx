import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Header } from '../components/layout';
import { Slider, Toggle, Modal, Input, Button } from '../components/ui';
import { LogOut, Users, MapPin, Download, Trash2, ChevronRight, Bell, UserPlus, MessageCircle, AlertCircle, Clock, Moon, CheckCircle, XCircle, Tag, Loader2, Store, Monitor, Mail, Lock, HelpCircle, Info, RefreshCw, ExternalLink, Sun, MessageSquarePlus, Sparkles, FlaskConical, Share, Shield } from 'lucide-react';
import { useReportProblem } from '../contexts/ReportProblemContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { useUserLocation } from '../hooks/useUserLocation';
import { useLocationName } from '../hooks/useLocationName';
import { useDarkMode } from '../hooks/useDarkMode';
import type { NotificationPreferences } from '../types';

export default function SettingsPage() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const { openReport } = useReportProblem();
  const navigate = useNavigate();
  const { location } = useUserLocation();

  const { permission, isSubscribed, isLoading: isPushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();
  const { locationName, isLoading: locationLoading } = useLocationName(location);

  const { isDark, toggle: toggleDarkMode } = useDarkMode();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
  const [allowDms, setAllowDms] = useState(profile?.allow_dms ?? true);
  const [radius, setRadius] = useState(profile?.settings_radius || 10);

  const handleToggleAllowDms = async () => {
    if (!user?.id) return;
    const newValue = !allowDms;
    setAllowDms(newValue);
    const { error } = await supabase
      .from('profiles')
      .update({ allow_dms: newValue })
      .eq('id', user.id);
    if (error) {
      showToast('Failed to update setting', 'error');
      setAllowDms(!newValue);
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

  const handleExportData = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const { data, error } = await supabase.rpc('export_user_data');
    setIsExporting(false);
    if (error || !data) {
      showToast(error?.message ?? 'Could not export data', 'error');
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lincc-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Your data is downloading', 'success');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE' || !user?.id) return;
    setIsDeleting(true);

    const { data, error } = await supabase.functions.invoke('delete-account');

    if (error || (data && (data as { error?: string }).error)) {
      const message = (data as { error?: string } | null)?.error ?? error?.message ?? 'Failed to delete account';
      showToast(message, 'error');
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

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      showToast('Please enter a valid email', 'error');
      return;
    }
    setIsChangingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    setIsChangingEmail(false);
    if (error) {
      showToast(error.message || 'Failed to update email', 'error');
    } else {
      showToast('Confirmation sent to your new email', 'success');
      setShowEmailChange(false);
      setNewEmail('');
    }
  };

  // Get linked identity providers
  const identities = user?.identities || [];
  const hasGoogle = identities.some((i) => i.provider === 'google');
  const hasEmail = identities.some((i) => i.provider === 'email');

  return (
    <div className="min-h-screen bg-background pb-8 max-w-2xl mx-auto">
      <Header showBack showLogo />

      <div className="p-4 lg:p-6 space-y-6">
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

            {/* Allow DMs — global preference applied across all events */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle className="h-5 w-5 text-blue" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Allow direct messages</h3>
                <p className="text-sm text-text-muted">When off, new people can't start a DM with you. Existing chats stay open.</p>
              </div>
              <Toggle checked={allowDms} onChange={handleToggleAllowDms} />
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3 px-1">
            Appearance
          </h2>
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple/10 rounded-xl flex items-center justify-center flex-shrink-0">
                {isDark ? <Moon className="h-5 w-5 text-purple" /> : <Sun className="h-5 w-5 text-purple" />}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Dark Mode</h3>
                <p className="text-sm text-text-muted">{isDark ? 'Dark theme active' : 'Light theme active'}</p>
              </div>
              <Toggle checked={isDark} onChange={toggleDarkMode} />
            </div>
          </div>
        </section>

        {/* Business */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3 px-1">
            Business
          </h2>
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            {profile?.account_type === 'business' ? (
              <button
                onClick={() => navigate('/business/dashboard')}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-background transition-colors"
              >
                <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store className="h-5 w-5 text-coral" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-text">Business dashboard</h3>
                  <p className="text-sm text-text-muted">Manage your business profile and vouchers</p>
                </div>
                <ChevronRight className="h-5 w-5 text-text-muted" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/become-a-business')}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-background transition-colors"
              >
                <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store className="h-5 w-5 text-coral" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-text">Become a business</h3>
                  <p className="text-sm text-text-muted">Post deals and offers to people nearby</p>
                </div>
                <ChevronRight className="h-5 w-5 text-text-muted" />
              </button>
            )}
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3 px-1">
            Notifications
          </h2>
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            {/* Master toggle — all notifications on/off */}
            {/* Blocked notification warning */}
            {permission === 'denied' && (
              <div className="p-4 bg-error/5 border-b border-error/10">
                <p className="text-sm text-error font-medium">Notifications blocked</p>
                <p className="text-xs text-text-muted mt-0.5">
                  To enable notifications, go to your browser settings and allow notifications for this site.
                </p>
              </div>
            )}

            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell className="h-5 w-5 text-coral" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">All Notifications</h3>
                <p className="text-sm text-text-muted">
                  {permission === 'denied' ? 'Blocked in browser settings' : 'Enable or disable all notifications'}
                </p>
              </div>
              <Toggle
                checked={allOn}
                onChange={handleToggleAll}
                disabled={permission === 'denied' || isPushLoading}
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
              <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-success" />
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

        {/* Account Management */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3 px-1">
            Account
          </h2>
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-blue" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-text">Email</h3>
                  <p className="text-sm text-text-muted truncate">{user?.email || 'Not set'}</p>
                </div>
                <button
                  onClick={() => setShowEmailChange(!showEmailChange)}
                  className="text-xs text-coral font-medium hover:underline flex-shrink-0"
                >
                  {showEmailChange ? 'Cancel' : 'Change'}
                </button>
              </div>
              {showEmailChange && (
                <div className="mt-3 flex gap-2 pl-[52px]">
                  <Input
                    type="email"
                    placeholder="New email address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleChangeEmail}
                    disabled={isChangingEmail || !newEmail.trim()}
                    className="px-4 text-sm"
                  >
                    {isChangingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update'}
                  </Button>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/reset-password')}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-background transition-colors"
            >
              <div className="w-10 h-10 bg-purple/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock className="h-5 w-5 text-purple" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Change Password</h3>
                <p className="text-sm text-text-muted">Update your password</p>
              </div>
              <ChevronRight className="h-5 w-5 text-text-muted" />
            </button>

            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-background transition-colors disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center">
                {isExporting ? <Loader2 className="h-5 w-5 text-text-muted animate-spin" /> : <Download className="h-5 w-5 text-text-muted" />}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Export My Data</h3>
                <p className="text-sm text-text-muted">{isExporting ? 'Preparing your data…' : 'Download a JSON copy of everything'}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-text-muted" />
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-background transition-colors"
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

        {/* Linked Accounts */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3 px-1">
            Linked Accounts
          </h2>
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-blue" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Email & Password</h3>
                <p className="text-sm text-text-muted">{hasEmail ? 'Connected' : 'Not connected'}</p>
              </div>
              {hasEmail && <CheckCircle className="h-5 w-5 text-success" />}
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-error/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Google</h3>
                <p className="text-sm text-text-muted">{hasGoogle ? 'Connected' : 'Not connected'}</p>
              </div>
              {hasGoogle ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <button
                  onClick={async () => {
                    const { error } = await supabase.auth.linkIdentity({ provider: 'google' });
                    if (error) showToast(error.message, 'error');
                  }}
                  className="text-xs text-coral font-medium hover:underline"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </section>

        {/* About & Support */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3 px-1">
            About
          </h2>
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            <button
              onClick={() => navigate('/landing/about')}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-background transition-colors"
            >
              <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Info className="h-5 w-5 text-coral" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">About Lincc</h3>
              </div>
              <ChevronRight className="h-5 w-5 text-text-muted" />
            </button>

            <button
              onClick={() => openReport({ source: 'settings' })}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-background transition-colors"
            >
              <div className="w-10 h-10 bg-error/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-error" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Report a problem</h3>
                <p className="text-sm text-text-muted">Something broke or you're stuck? Tell us — we attach your device details automatically</p>
              </div>
              <ChevronRight className="h-5 w-5 text-text-muted" />
            </button>

            <button
              onClick={() => navigate('/feedback')}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-background transition-colors"
            >
              <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageSquarePlus className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Send Feedback</h3>
                <p className="text-sm text-text-muted">Feature requests &amp; general feedback</p>
              </div>
              <ChevronRight className="h-5 w-5 text-text-muted" />
            </button>

            <button
              onClick={() => navigate('/landing/contact')}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-background transition-colors"
            >
              <div className="w-10 h-10 bg-purple/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <HelpCircle className="h-5 w-5 text-purple" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Help & Support</h3>
              </div>
              <ChevronRight className="h-5 w-5 text-text-muted" />
            </button>

            <button
              onClick={() => navigate('/landing/privacy')}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-background transition-colors"
            >
              <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center flex-shrink-0">
                <ExternalLink className="h-5 w-5 text-text-muted" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Privacy Policy</h3>
              </div>
              <ChevronRight className="h-5 w-5 text-text-muted" />
            </button>

            {/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches && (
              <div className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Share className="h-5 w-5 text-blue" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-text">Add to Home Screen</h3>
                  <p className="text-sm text-text-muted">Tap Share → Add to Home Screen</p>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if ('caches' in window) {
                  caches.keys().then(names => names.forEach(name => caches.delete(name)));
                  showToast('Cache cleared', 'success');
                } else {
                  showToast('Cache not available', 'info');
                }
              }}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-background transition-colors"
            >
              <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center flex-shrink-0">
                <RefreshCw className="h-5 w-5 text-text-muted" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-text">Clear Cache</h3>
                <p className="text-sm text-text-muted">Free up storage space</p>
              </div>
            </button>
          </div>
        </section>

        {profile?.role === 'admin' && (
          <section>
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3 px-1">
              Developer
            </h2>
            <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
              <button
                onClick={() => navigate('/admin')}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-background transition-colors"
              >
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center flex-shrink-0 text-white">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-text">Admin panel</h3>
                  <p className="text-sm text-text-muted">User, business, event and report management</p>
                </div>
                <ChevronRight className="h-5 w-5 text-text-muted" />
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem('lincc-welcome-guide-dismissed');
                  showToast('Replaying welcome guide…', 'success');
                  window.location.href = '/';
                }}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-background transition-colors"
              >
                <div className="w-10 h-10 bg-coral/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-coral" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-text">Replay welcome guide</h3>
                  <p className="text-sm text-text-muted">Re-show the tooltip walkthrough on the home screen</p>
                </div>
                <ChevronRight className="h-5 w-5 text-text-muted" />
              </button>

              <button
                onClick={() => navigate('/onboarding?preview=true')}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-background transition-colors"
              >
                <div className="w-10 h-10 bg-purple/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FlaskConical className="h-5 w-5 text-purple" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-text">Replay onboarding</h3>
                  <p className="text-sm text-text-muted">Walk through the full signup onboarding flow</p>
                </div>
                <ChevronRight className="h-5 w-5 text-text-muted" />
              </button>
            </div>
          </section>
        )}

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
          Lincc v0.12.1
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
              This action is permanent and cannot be undone. All your data (events, messages, connections) will be permanently deleted.
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
