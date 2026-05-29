import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { GradientButton, Input } from '../../components/ui';

const LOGO_URL = 'https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  // Set when we bounce a returning user here from the signup page.
  const alreadyHasAccount = searchParams.get('exists') === '1';
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signInWithProvider } = useAuth();
  const { showToast } = useToast();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await signInWithProvider('google');
    if (error) {
      showToast(error.message, 'error');
      setIsLoading(false);
    }
    // On success, Supabase redirects to Google — no need to clear loading
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid') || msg.includes('credentials')) {
        showToast('Incorrect email or password.', 'error');
      } else if (msg.includes('not confirmed') || msg.includes('not verified')) {
        showToast('Please verify your email first. Check your inbox.', 'error');
      } else {
        showToast(error.message, 'error');
      }
    }

    setIsLoading(false);
  };

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
            <button
              type="button"
              className="flex-1 text-center py-2 rounded-lg font-semibold text-sm gradient-primary text-white shadow-sm"
            >
              Sign In
            </button>
            <Link
              to="/signup"
              className="flex-1 text-center py-2 rounded-lg font-semibold text-sm text-text-muted hover:text-text transition-colors"
            >
              Sign Up
            </Link>
          </div>

          {alreadyHasAccount && (
            <div className="mb-5 rounded-xl border border-coral/30 bg-coral/5 p-3 text-sm text-text">
              You already have an account with this email. Please sign in below.
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
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
              placeholder="Your password"
              required
            />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-coral hover:text-coral/80">
                Forgot password?
              </Link>
            </div>

            <GradientButton type="submit" fullWidth isLoading={isLoading}>
              Sign In
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

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 h-11 px-6 rounded-xl border border-border bg-surface text-text font-semibold text-sm hover:border-coral transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
