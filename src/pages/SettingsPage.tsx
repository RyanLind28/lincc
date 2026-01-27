import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Header } from '../components/layout';
import { Slider } from '../components/ui';
import { LogOut, Ghost, Users, MapPin, Download, Trash2, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SettingsPage() {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

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
      await refreshProfile();
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
      await refreshProfile();
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
      await refreshProfile();
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
            {profile?.gender === 'woman' && (
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
