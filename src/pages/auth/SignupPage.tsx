import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { GradientButton, Input } from '../../components/ui';
import { Mail, CheckCircle, Store } from 'lucide-react';

const LOGO_URL = 'https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp';

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationSent, setShowVerificationSent] = useState(false);
  const [isBusiness, setIsBusiness] = useState(searchParams.get('business') === 'true');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { signUp, signInWithMagicLink, signInWithProvider, resendConfirmation } = useAuth();
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

    if (!ageConfirmed) {
      showToast('You must be 18 or over to use Lincc', 'error');
      return;
    }

    setIsLoading(true);

    const { error, alreadyExists } = await signUp(email, password, {
      isBusiness,
      termsAccepted: true,
      ageConfirmed: true,
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

  const handleMagicLink = async () => {
    if (!email) {
      showToast('Please enter your email address', 'error');
      return;
    }

    setIsLoading(true);

    const { error } = await signInWithMagicLink(email);

    if (error) {
      showToast(error.message, 'error');
    } else {
      setShowVerificationSent(true);
    }

    setIsLoading(false);
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
            <p className="text-xs text-text-light mb-6">
              Didn't get it? Check your <strong>spam / junk folder</strong> — it can take a minute or two.
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
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-coral/5 to-purple/5 blur-3xl pointer-events-none" />
      <div className="w-full max-w-sm relative">
        <div className="flex justify-center mb-6">
          <img src={LOGO_URL} alt="Lincc" className="h-8" />
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold gradient-text mb-2">Join Lincc</h1>
            <p className="text-text-muted">Create your account</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
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

            {/* Business toggle */}
            <button
              type="button"
              onClick={() => setIsBusiness(!isBusiness)}
              className={`w-full p-3 rounded-xl border text-sm font-medium flex items-center gap-3 transition-colors ${
                isBusiness
                  ? 'border-coral bg-coral/5 text-coral'
                  : 'border-border bg-surface text-text-muted hover:border-coral'
              }`}
            >
              <Store className="h-5 w-5" />
              <span className="flex-1 text-left">{isBusiness ? 'Signing up as a business' : 'I have a business'}</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isBusiness ? 'border-coral bg-coral' : 'border-border'}`}>
                {isBusiness && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>

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
            </div>

            <GradientButton
              type="submit"
              fullWidth
              isLoading={isLoading}
              disabled={!termsAccepted || !ageConfirmed}
            >
              Create Account
            </GradientButton>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface text-text-light">or</span>
            </div>
          </div>

          <GradientButton
            variant="outline"
            fullWidth
            onClick={handleMagicLink}
            isLoading={isLoading}
            leftIcon={<Mail className="h-4 w-4" />}
          >
            Continue with Magic Link
          </GradientButton>

          {/* OAuth providers */}
          <div className="space-y-2 mt-4">
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 h-11 px-6 rounded-xl border border-border bg-surface text-text font-semibold text-sm hover:border-coral transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-3 h-11 px-6 rounded-xl border border-border bg-surface text-text font-semibold text-sm opacity-60 cursor-not-allowed"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              Continue with Apple
              <span className="text-xs text-text-muted font-normal">(not set up)</span>
            </button>
            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-3 h-11 px-6 rounded-xl border border-border bg-surface text-text font-semibold text-sm opacity-60 cursor-not-allowed"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/></svg>
              Continue with Facebook
              <span className="text-xs text-text-muted font-normal">(not set up)</span>
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-coral font-medium hover:text-coral/80">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
