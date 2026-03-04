import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { GradientButton, Input } from '../../components/ui';
import { Mail } from 'lucide-react';

const LOGO_URL = 'https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { resetPassword } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await resetPassword(email);

    if (error) {
      showToast(error.message, 'error');
    } else {
      setShowSuccess(true);
    }

    setIsLoading(false);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
        <div className="w-full max-w-sm">
          <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm text-center">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">Check your email</h1>
            <p className="text-text-muted mb-6">
              We sent a password reset link to <strong>{email}</strong>. Click the link to reset your password.
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
            <h1 className="text-3xl font-bold gradient-text mb-2">Reset Password</h1>
            <p className="text-text-muted">Enter your email and we'll send you a reset link</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <GradientButton type="submit" fullWidth isLoading={isLoading}>
              Send Reset Link
            </GradientButton>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          <Link to="/login" className="text-coral font-medium hover:text-coral/80">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
