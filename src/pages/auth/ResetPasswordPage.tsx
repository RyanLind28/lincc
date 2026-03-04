import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { GradientButton, Input } from '../../components/ui';
import { CheckCircle } from 'lucide-react';

const LOGO_URL = 'https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { updatePassword } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);

    const { error } = await updatePassword(password);

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
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">Password updated</h1>
            <p className="text-text-muted mb-6">
              Your password has been successfully reset. You can now sign in with your new password.
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
            <h1 className="text-3xl font-bold gradient-text mb-2">New Password</h1>
            <p className="text-text-muted">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New Password"
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
              Reset Password
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
