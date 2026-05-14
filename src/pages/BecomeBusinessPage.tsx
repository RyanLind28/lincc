import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Header } from '../components/layout';
import { Input, GradientButton } from '../components/ui';
import { convertToBusiness } from '../services/businessService';
import { BUSINESS_CATEGORIES } from '../types';

export default function BecomeBusinessPage() {
  const navigate = useNavigate();
  const { profile, refreshProfile, refreshBusiness } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(BUSINESS_CATEGORIES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If they're already a business, skip straight to the dashboard
  useEffect(() => {
    if (profile?.account_type === 'business') navigate('/business/dashboard', { replace: true });
  }, [profile?.account_type, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Business name is required', 'error');
      return;
    }
    setIsSubmitting(true);
    const result = await convertToBusiness(name, category);
    setIsSubmitting(false);

    if (!result.success) {
      showToast(result.error || 'Could not create your business', 'error');
      return;
    }
    await Promise.all([refreshProfile(), refreshBusiness()]);
    showToast('Business created. Please complete verification', 'success');
    navigate('/business/verify');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header showBack showLogo />
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl gradient-primary mx-auto flex items-center justify-center">
            <Store className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text">Become a business</h1>
          <p className="text-sm text-text-muted">
            Post deals, vouchers and limited-time offers to people nearby. Your application
            goes through a quick review before going live.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Business name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Daisy's Coffee"
            required
            autoFocus
          />

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-border bg-surface text-text text-sm focus:border-coral focus:outline-none"
            >
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <GradientButton fullWidth type="submit" isLoading={isSubmitting}>
              Continue <ArrowRight className="h-4 w-4 ml-1" />
            </GradientButton>
            <p className="text-xs text-text-muted text-center mt-3">
              You'll be asked to upload proof of business next.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
