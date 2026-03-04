import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { GradientButton, Input } from '../../components/ui';
import { Mail, CheckCircle } from 'lucide-react';

const LOGO_URL = 'https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationSent, setShowVerificationSent] = useState(false);
  const { signUp, signInWithMagicLink } = useAuth();
  const { showToast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      showToast(error.message, 'error');
    } else {
      setShowVerificationSent(true);
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
      setShowVerificationSent(true);
    }

    setIsLoading(false);
  };

  if (showVerificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm text-center">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">Verify your email</h1>
            <p className="text-text-muted mb-6">
              We sent a verification link to <strong>{email}</strong>. Please verify your email before signing in.
            </p>
            <Link to="/login">
              <GradientButton variant="outline">Back to login</GradientButton>
            </Link>
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
              placeholder="At least 6 characters"
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

            <GradientButton type="submit" fullWidth isLoading={isLoading}>
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
