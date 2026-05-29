import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { GradientButton, Input } from '../../components/ui';
import { CheckCircle, Store, User as UserIcon } from 'lucide-react';
import { BUSINESS_CATEGORIES, type AccountType } from '../../types';

const LOGO_URL = 'https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp';

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const [accountType, setAccountType] = useState<AccountType>(
    searchParams.get('business') === 'true' ? 'business' : 'personal'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState<string>(BUSINESS_CATEGORIES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationSent, setShowVerificationSent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { signUp, signInWithProvider, resendConfirmation } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      showToast('Password must include an uppercase letter and a number', 'error');
      return;
    }
    if (!termsAccepted) {
      showToast('Please accept the Terms & Conditions', 'error');
      return;
    }
    if (accountType === 'personal' && !ageConfirmed) {
      showToast('You must be 18 or over to use Lincc', 'error');
      return;
    }
    if (!firstName.trim()) {
      showToast('Please enter your first name', 'error');
      return;
    }
    if (!lastName.trim()) {
      showToast('Please enter your last name', 'error');
      return;
    }
    if (accountType === 'business' && !businessName.trim()) {
      showToast('Please enter your business name', 'error');
      return;
    }

    setIsLoading(true);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const { error, alreadyExists } = await signUp(email, password, {
      accountType,
      termsAccepted: true,
      ageConfirmed: accountType === 'personal' ? true : undefined,
      firstName: trimmedFirst,
      lastName: trimmedLast,
      // profile_name defaults to "First Last" — users can edit it during onboarding.
      profileName: `${trimmedFirst} ${trimmedLast}`,
      businessName: accountType === 'business' ? businessName : undefined,
      businessCategory: accountType === 'business' ? businessCategory : undefined,
    });

    if (alreadyExists) {
      showToast('This email is already registered. Redirecting to sign in…', 'error');
      setTimeout(() => navigate(`/login?email=${encodeURIComponent(email)}`), 1200);
    } else if (error) {
      showToast(error.message, 'error');
    } else {
      setShowVerificationSent(true);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    const { error } = await resendConfirmation(email);
    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Confirmation email resent. Check your inbox and spam folder.', 'success');
      setResendCooldown(60);
    }
  };

  const handleGoogleSignup = async () => {
    if (accountType === 'business') {
      showToast('Business accounts must sign up with email. Google sign-up coming soon', 'error');
      return;
    }
    if (!termsAccepted || !ageConfirmed) {
      showToast('Please accept the terms and confirm you are 18+ first', 'error');
      return;
    }
    setIsLoading(true);
    const { error } = await signInWithProvider('google');
    if (error) {
      showToast(error.message, 'error');
      setIsLoading(false);
    }
  };

  if (showVerificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-coral/5 to-purple/5 blur-3xl pointer-events-none" />
        <div className="w-full max-w-sm relative">
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm text-center">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">Verify your email</h1>
            <p className="text-text-muted mb-4">
              We sent a verification link to <strong>{email}</strong>. Please verify your email before signing in.
            </p>
            {accountType === 'business' && (
              <p className="text-sm text-text-muted mb-4">
                After verifying, you'll set up your business profile and can start posting straight away. You can verify your business anytime for the official tick.
              </p>
            )}
            <p className="text-xs text-text-light mb-6">
              Didn't get it? Check your <strong>spam / junk folder</strong>. It can take a minute or two.
            </p>
            <GradientButton
              variant="outline"
              fullWidth
              onClick={handleResend}
              disabled={resendCooldown > 0}
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend confirmation email'}
            </GradientButton>
            <Link to="/login" className="inline-block mt-4 text-sm text-coral hover:text-coral/80">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-coral/5 to-purple/5 blur-3xl pointer-events-none" />
      <div className="w-full max-w-sm relative">
        <div className="flex justify-center mb-6">
          <img src={LOGO_URL} alt="Lincc" className="h-8" />
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
          {/* Sign In / Sign Up tabs */}
          <div className="flex bg-background rounded-xl p-1 mb-6">
            <Link
              to="/login"
              className="flex-1 text-center py-2 rounded-lg font-semibold text-sm text-text-muted hover:text-text transition-colors"
            >
              Sign In
            </Link>
            <button
              type="button"
              className="flex-1 text-center py-2 rounded-lg font-semibold text-sm gradient-primary text-white shadow-sm"
            >
              Sign Up
            </button>
          </div>

          {/* Account type chooser */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <button
              type="button"
              onClick={() => setAccountType('personal')}
              className={`p-3 rounded-xl border-2 text-left transition-colors ${
                accountType === 'personal'
                  ? 'border-coral bg-coral/5'
                  : 'border-border bg-background hover:border-coral/40'
              }`}
            >
              <UserIcon className={`h-5 w-5 mb-1 ${accountType === 'personal' ? 'text-coral' : 'text-text-muted'}`} />
              <p className="font-semibold text-sm text-text">Personal</p>
              <p className="text-xs text-text-muted">Find and host events</p>
            </button>
            <button
              type="button"
              onClick={() => setAccountType('business')}
              className={`p-3 rounded-xl border-2 text-left transition-colors ${
                accountType === 'business'
                  ? 'border-coral bg-coral/5'
                  : 'border-border bg-background hover:border-coral/40'
              }`}
            >
              <Store className={`h-5 w-5 mb-1 ${accountType === 'business' ? 'text-coral' : 'text-text-muted'}`} />
              <p className="font-semibold text-sm text-text">Business</p>
              <p className="text-xs text-text-muted">Promotions, vouchers, events</p>
            </button>
          </div>

          {accountType === 'business' && (
            <p className="text-xs text-text-muted mb-4">
              Set up your profile in a couple of minutes and start posting deals, vouchers and events. Verify your business anytime to earn the official tick.
            </p>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={accountType === 'business' ? 'Contact first name' : 'First name'}
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Alex"
                autoComplete="given-name"
                required
              />
              <Input
                label={accountType === 'business' ? 'Contact last name' : 'Last name'}
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Smith"
                autoComplete="family-name"
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters, 1 uppercase & 1 number"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />

            {accountType === 'business' && (
              <>
                <Input
                  label="Business name"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Daisy's Coffee"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-text mb-1.5">Category</label>
                  <select
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-border bg-surface text-text text-sm focus:border-coral focus:outline-none"
                  >
                    {BUSINESS_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="space-y-2 pt-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-coral focus:ring-coral flex-shrink-0"
                />
                <span className="text-sm text-text leading-snug">
                  I accept the{' '}
                  <Link to="/landing/terms" target="_blank" className="text-coral hover:text-coral/80 underline">
                    Terms &amp; Conditions
                  </Link>
                </span>
              </label>
              {accountType === 'personal' && (
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-coral focus:ring-coral flex-shrink-0"
                  />
                  <span className="text-sm text-text leading-snug">
                    I confirm I am 18 years of age or older
                  </span>
                </label>
              )}
            </div>

            <GradientButton
              type="submit"
              fullWidth
              isLoading={isLoading}
              disabled={!termsAccepted || (accountType === 'personal' && !ageConfirmed)}
            >
              {accountType === 'business' ? 'Create business account' : 'Create Account'}
            </GradientButton>
          </form>

          {accountType === 'personal' && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-surface text-text-light">or</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 h-11 px-6 rounded-xl border border-border bg-surface text-text font-semibold text-sm hover:border-coral transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
