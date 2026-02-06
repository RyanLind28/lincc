import { useState } from 'react';
import { ChevronRight, Check, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    // If Supabase isn't configured, simulate success for demo purposes
    if (!isSupabaseConfigured || !supabase) {
      // In production, you'd want to set up Supabase
      // For now, just show success after a brief delay
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
        console.error('Supabase error:', error);
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
      <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto text-center border border-gray-100">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <Check className="h-7 w-7 text-green-600" />
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">You're on the list!</h3>
        <p className="text-gray-600">
          We'll notify you when Lincc is ready. Get excited to make real connections!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto border border-gray-100">
      <div className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-purple focus:ring-2 focus:ring-purple/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-purple focus:ring-2 focus:ring-purple/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
          />
        </div>
        {status === 'error' && (
          <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{errorMessage}</p>
        )}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full px-6 py-4 rounded-full gradient-primary text-white font-semibold text-lg hover:shadow-lg hover:shadow-purple/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              Join Waitlist
              <ChevronRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
      <p className="mt-5 text-xs text-gray-500 text-center">
        We'll only email you when we launch. No spam, ever.
      </p>
    </form>
  );
}
