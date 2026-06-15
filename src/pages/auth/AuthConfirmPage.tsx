import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { GradientButton } from '../../components/ui';
import { XCircle, Loader2 } from 'lucide-react';

const LOGO_URL = 'https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp';

type OtpType = 'signup' | 'magiclink' | 'recovery' | 'invite' | 'email_change' | 'email';
const VALID_TYPES: OtpType[] = ['signup', 'magiclink', 'recovery', 'invite', 'email_change', 'email'];

// Only allow same-origin redirects. Anything else falls back to '/'.
function safeNext(raw: string | null): string {
  if (!raw) return '/';
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return '/';
    return url.pathname + url.search + url.hash;
  } catch {
    return raw.startsWith('/') ? raw : '/';
  }
}

export default function AuthConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const ranRef = useRef(false);

  useEffect(() => {
    // StrictMode double-invokes effects in dev — guard so we don't burn the token.
    if (ranRef.current) return;
    ranRef.current = true;

    const tokenHash = searchParams.get('token_hash');
    const typeParam = searchParams.get('type');
    const next = safeNext(searchParams.get('next'));

    if (!tokenHash || !typeParam || !VALID_TYPES.includes(typeParam as OtpType)) {
      setStatus('error');
      setErrorMessage('This confirmation link is invalid or has expired. Please request a new one.');
      return;
    }

    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: typeParam as OtpType })
      .then(({ error }) => {
        if (error) {
          setStatus('error');
          setErrorMessage(
            error.message?.toLowerCase().includes('expired')
              ? 'This link has expired. Please request a new one from the sign-in screen.'
              : error.message || 'We couldn\'t verify this link. Please try signing in instead.'
          );
          return;
        }
        // Recovery flow always goes to /reset-password regardless of `next`.
        navigate(typeParam === 'recovery' ? '/reset-password' : next, { replace: true });
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-coral/5 to-purple/5 blur-3xl pointer-events-none" />
      <div className="w-full max-w-sm relative">
        <div className="flex justify-center mb-6">
          <img src={LOGO_URL} alt="Lincc" className="h-8" />
        </div>
        <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm text-center">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-text mb-2">Verifying your email</h1>
              <p className="text-text-muted">Hold on a moment...</p>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-coral/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-8 w-8 text-coral" />
              </div>
              <h1 className="text-2xl font-bold text-text mb-2">Couldn't verify</h1>
              <p className="text-text-muted mb-6">{errorMessage}</p>
              <Link to="/login">
                <GradientButton fullWidth>Go to sign in</GradientButton>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
