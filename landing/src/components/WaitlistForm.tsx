import { useState } from 'react';
import { ChevronRight, Check, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const styles = {
  form: {
    background: '#fff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    maxWidth: '448px',
    margin: '0 auto',
    border: '1px solid #f3f4f6',
  } as React.CSSProperties,
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '8px',
    textAlign: 'left',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    outline: 'none',
    fontSize: '16px',
    color: '#111827',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  button: {
    width: '100%',
    padding: '16px 24px',
    borderRadius: '9999px',
    background: 'linear-gradient(135deg, #FF6B6B 0%, #845EF7 100%)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '18px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  } as React.CSSProperties,
  error: {
    color: '#ef4444',
    fontSize: '14px',
    background: '#fef2f2',
    padding: '8px 16px',
    borderRadius: '8px',
  } as React.CSSProperties,
  note: {
    marginTop: '20px',
    fontSize: '12px',
    color: '#9ca3af',
    textAlign: 'center',
  } as React.CSSProperties,
  successBox: {
    background: '#fff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
    maxWidth: '448px',
    margin: '0 auto',
    textAlign: 'center',
    border: '1px solid #f3f4f6',
  } as React.CSSProperties,
  successIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#dcfce7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
  } as React.CSSProperties,
  successTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '8px',
  } as React.CSSProperties,
  successText: {
    color: '#6b7280',
    fontSize: '16px',
  } as React.CSSProperties,
};

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    if (!isSupabaseConfigured || !supabase) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStatus('success');
      setEmail('');
      setName('');
      return;
    }

    try {
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email, name }]);

      if (error) {
        if (error.code === '23505') {
          setErrorMessage('This email is already on the waitlist!');
        } else {
          setErrorMessage(error.message || 'Something went wrong. Please try again.');
        }
        setStatus('error');
        return;
      }

      setStatus('success');
      setEmail('');
      setName('');
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div style={styles.successBox}>
        <div style={styles.successIcon}>
          <Check style={{ width: 28, height: 28, color: '#16a34a' }} />
        </div>
        <h3 style={styles.successTitle}>You're on the list!</h3>
        <p style={styles.successText}>We'll notify you as soon as Lincc is ready.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.fieldGroup}>
        <div>
          <label htmlFor="wl-name" style={styles.label}>Name</label>
          <input
            type="text"
            id="wl-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            style={styles.input}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#845EF7';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(132,94,247,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
        <div>
          <label htmlFor="wl-email" style={styles.label}>Email</label>
          <input
            type="email"
            id="wl-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={styles.input}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#845EF7';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(132,94,247,0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>
        {status === 'error' && (
          <p style={styles.error}>{errorMessage}</p>
        )}
        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            ...styles.button,
            ...(status === 'loading' ? styles.buttonDisabled : {}),
          }}
          onMouseEnter={(e) => {
            if (status !== 'loading') {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(132,94,247,0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {status === 'loading' ? (
            <>
              <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
              Joining...
            </>
          ) : (
            <>
              Join Waitlist
              <ChevronRight style={{ width: 20, height: 20 }} />
            </>
          )}
        </button>
      </div>
      <p style={styles.note}>We'll keep you updated along the way.</p>
    </form>
  );
}
