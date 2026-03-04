import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { GradientButton, Input } from '../../components/ui';
import { Mail } from 'lucide-react';

const LOGO_URL = 'https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMagicLinkSent, setShowMagicLinkSent] = useState(false);
  const { signIn, signInWithMagicLink } = useAuth();
  const { showToast } = useToast();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      showToast(error.message, 'error');
    }

    setIsLoading(false);
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
      setShowMagicLinkSent(true);
    }

    setIsLoading(false);
  };

  if (showMagicLinkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm text-center">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">Check your email</h1>
            <p className="text-text-muted mb-6">
              We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
            </p>
            <GradientButton variant="outline" onClick={() => setShowMagicLinkSent(false)}>
              Use a different email
            </GradientButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <img src={LOGO_URL} alt="Lincc" className="h-8" />
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold gradient-text mb-2">Sign In</h1>
            <p className="text-text-muted">Connect with people nearby</p>
          </div>

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

          <GradientButton
            variant="outline"
            fullWidth
            onClick={handleMagicLink}
            isLoading={isLoading}
            leftIcon={<Mail className="h-4 w-4" />}
          >
            Send Magic Link
          </GradientButton>
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-coral font-medium hover:text-coral/80">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
