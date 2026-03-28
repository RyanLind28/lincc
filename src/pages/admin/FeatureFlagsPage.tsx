import { useState, useEffect } from 'react';
import { Header } from '../../components/layout';
import { Toggle, ChatListSkeleton } from '../../components/ui';
import { Zap } from 'lucide-react';
import { fetchFeatureFlags, toggleFeatureFlag } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

interface FeatureFlag {
  id: string;
  key: string;
  description: string | null;
  is_enabled: boolean;
  updated_at: string;
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { showToast } = useToast();

  const load = async () => {
    setIsLoading(true);
    const { data } = await fetchFeatureFlags();
    setFlags(data as FeatureFlag[]);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (flag: FeatureFlag) => {
    if (!user?.id) return;
    const result = await toggleFeatureFlag(flag.id, !flag.is_enabled, user.id);
    if (result.success) {
      setFlags((prev) => prev.map((f) => f.id === flag.id ? { ...f, is_enabled: !f.is_enabled } : f));
      showToast(`${flag.key} ${!flag.is_enabled ? 'enabled' : 'disabled'}`, 'success');
    } else {
      showToast(result.error || 'Failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header title="Feature Flags" showBack />

      <div className="p-4">
        <p className="text-sm text-text-muted mb-4">Toggle features on or off for all users.</p>

        {isLoading ? (
          <ChatListSkeleton count={5} />
        ) : flags.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 mt-8">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-text mb-1">No feature flags</h2>
            <p className="text-text-muted text-center text-sm">Add flags via database.</p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            {flags.map((flag) => (
              <div key={flag.id} className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${flag.is_enabled ? 'bg-green-500/10' : 'bg-gray-100'}`}>
                  <Zap className={`h-5 w-5 ${flag.is_enabled ? 'text-green-500' : 'text-text-muted'}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-text font-mono text-sm">{flag.key}</h3>
                  {flag.description && <p className="text-xs text-text-muted">{flag.description}</p>}
                </div>
                <Toggle checked={flag.is_enabled} onChange={() => handleToggle(flag)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
