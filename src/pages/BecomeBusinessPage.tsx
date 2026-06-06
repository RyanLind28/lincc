import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowRight, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Header } from '../components/layout';
import { Input, GradientButton, Modal } from '../components/ui';
import { convertToBusiness } from '../services/businessService';
import { BUSINESS_CATEGORIES } from '../types';

export default function BecomeBusinessPage() {
  const navigate = useNavigate();
  const { profile, refreshProfile, refreshBusiness, signOut } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(BUSINESS_CATEGORIES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // If they're already a business, skip straight to the dashboard
  useEffect(() => {
    if (profile?.account_type === 'business') navigate('/business/dashboard', { replace: true });
  }, [profile?.account_type, navigate]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Business name is required', 'error');
      return;
    }
    setShowConfirm(true);
  };

  const handleConvertConfirmed = async () => {
    setIsSubmitting(true);
    const result = await convertToBusiness(name, category);
    if (!result.success) {
      setIsSubmitting(false);
      setShowConfirm(false);
      showToast(result.error || 'Could not create your business', 'error');
      return;
    }
    await Promise.all([refreshProfile(), refreshBusiness()]);
    setIsSubmitting(false);
    setShowConfirm(false);
    showToast("Business created. Let's get you set up", 'success');
    navigate('/onboarding/business');
  };

  const handleSignOutInstead = async () => {
    setShowConfirm(false);
    await signOut();
    navigate('/signup');
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
            Post deals, vouchers and limited-time offers to people nearby.
          </p>
        </div>

        {/* Lock-in warning, visible on the page itself so it's not hidden in a modal */}
        <div className="rounded-2xl border border-warning/40 bg-warning/5 p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-text">
              This change is permanent
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              Once you convert, this account stays a business. You can't switch it
              back to a personal profile. If you want to keep your personal
              account, log out and sign up as a business with a different email.
            </p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
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
            <GradientButton fullWidth type="submit">
              Continue <ArrowRight className="h-4 w-4 ml-1" />
            </GradientButton>
            <p className="text-xs text-text-muted text-center mt-3">
              We'll walk you through verification and a quick profile setup next.
            </p>
          </div>
        </form>
      </div>

      <Modal
        isOpen={showConfirm}
        onClose={() => { if (!isSubmitting) setShowConfirm(false); }}
        title="Convert to a business account?"
        size="sm"
        showCloseButton={!isSubmitting}
        closeOnOverlayClick={!isSubmitting}
      >
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-2 text-sm text-text-muted">
              <p>
                You're about to convert <span className="font-semibold text-text">this account</span> into
                a business profile for <span className="font-semibold text-text">{name.trim() || 'your business'}</span>.
              </p>
              <p>
                <span className="font-semibold text-text">This can't be undone.</span> Your personal
                profile, events, and saved items will become part of the business
                account. You won't be able to switch back.
              </p>
              <p>
                Want to keep your personal account? Log out and sign up as a
                business with a different email instead.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleSignOutInstead}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-border text-sm font-medium text-text hover:bg-background disabled:opacity-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out instead
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center h-11 px-4 rounded-xl border border-border text-sm font-medium text-text hover:bg-background disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>

          <GradientButton
            onClick={handleConvertConfirmed}
            isLoading={isSubmitting}
            fullWidth
          >
            Yes, convert this account
          </GradientButton>
        </div>
      </Modal>
    </div>
  );
}
