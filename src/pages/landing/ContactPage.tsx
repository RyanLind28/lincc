import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Check, Loader2, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">Contact</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Get in touch</h1>
          <p className="text-xl text-gray-600 mb-12">
            Have questions, feedback, or just want to say hi? We'd love to hear from you.
          </p>

          <div className="grid gap-6 md:grid-cols-2 mb-16">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Us</h2>
              <p className="text-gray-600 mb-4">For general inquiries and support</p>
              <a href="mailto:hello@lincc.app" className="text-purple font-semibold hover:underline">
                hello@lincc.app
              </a>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Follow Us</h2>
              <p className="text-gray-600 mb-4">Stay updated on our launch</p>
              <div className="flex gap-4">
                <a href="#" className="text-purple font-semibold hover:underline">X</a>
                <a href="#" className="text-purple font-semibold hover:underline">Instagram</a>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-coral/5 via-purple/5 to-blue/5 rounded-2xl p-8 sm:p-12 border border-purple/10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
              Want to be first to know when we launch?
            </h2>
            <p className="text-gray-600 mb-8 text-center max-w-lg mx-auto">
              Join our waitlist and we'll send you an invite as soon as Lincc is ready.
            </p>
            <WaitlistForm />
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/landing" className="flex items-center">
            <img src="https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp" alt="Lincc" className="h-10" />
          </Link>
          <Link
            to="/landing#waitlist"
            className="px-5 py-2.5 rounded-full gradient-primary text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple/25 hover:-translate-y-0.5 transition-all"
          >
            Join Waitlist
          </Link>
        </div>
      </div>
    </nav>
  );
}

function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

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
      <div className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto text-center border border-gray-100">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <Check className="h-7 w-7 text-green-600" />
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">You're on the list!</h3>
        <p className="text-gray-600">We'll notify you as soon as Lincc is ready.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto border border-gray-100">
      <div className="space-y-5">
        <div>
          <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            id="contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-purple focus:ring-2 focus:ring-purple/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            id="contact-email"
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
            <><Loader2 className="h-5 w-5 animate-spin" /> Joining...</>
          ) : (
            <><span>Join Waitlist</span> <ChevronRight className="h-5 w-5" /></>
          )}
        </button>
      </div>
      <p className="mt-5 text-xs text-gray-500 text-center">We'll only email you when we launch.</p>
    </form>
  );
}

function LandingFooter() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/landing" className="flex items-center">
            <img src="https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp" alt="Lincc" className="h-10" />
          </Link>
          <div className="flex items-center gap-6 text-gray-600">
            <Link to="/landing/about" className="hover:text-purple transition-colors">About</Link>
            <Link to="/landing/privacy" className="hover:text-purple transition-colors">Privacy</Link>
            <Link to="/landing/terms" className="hover:text-purple transition-colors">Terms</Link>
            <Link to="/landing/contact" className="hover:text-purple transition-colors">Contact</Link>
          </div>
          <p className="text-gray-500 text-sm">&copy; 2026 Lincc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
