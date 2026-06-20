import { Link } from 'react-router-dom';
import { Mail, MapPin, ChevronRight } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-surface">
      <LandingNav />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">Contact</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-text mb-4">Get in touch</h1>
          <p className="text-xl text-text-muted mb-12">
            Have questions, feedback, or just want to say hi? We'd love to hear from you.
          </p>

          <div className="grid gap-6 md:grid-cols-2 mb-16">
            <div className="bg-background rounded-2xl p-8 border border-border">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-text mb-2">Email Us</h2>
              <p className="text-text-muted mb-4">For general inquiries and support</p>
              <a href="mailto:hello@lincc.live" className="text-purple font-semibold hover:underline">
                hello@lincc.live
              </a>
            </div>

            <div className="bg-background rounded-2xl p-8 border border-border">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-text mb-2">Follow Us</h2>
              <p className="text-text-muted mb-4">Stay updated on our launch</p>
              <div className="flex gap-4">
                <a href="#" className="text-purple font-semibold hover:underline">X</a>
                <a href="#" className="text-purple font-semibold hover:underline">Instagram</a>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-coral/5 via-purple/5 to-blue/5 rounded-2xl p-8 sm:p-12 border border-purple/10 text-center">
            <h2 className="text-2xl font-semibold text-text mb-4">
              Ready to dive in?
            </h2>
            <p className="text-text-muted mb-8 max-w-lg mx-auto">
              Join Lincc and never miss what's happening around you again. It's free.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 rounded-full gradient-primary text-white font-semibold text-lg hover:shadow-lg hover:shadow-purple/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                Sign up <ChevronRight className="h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-surface border border-border text-text font-semibold text-lg hover:border-purple hover:text-purple transition-all flex items-center justify-center"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[var(--z-header)] bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/landing" className="flex items-center">
            <img src="https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp" alt="Lincc" className="h-10" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="px-4 py-2.5 rounded-full text-text font-semibold text-sm hover:text-purple transition-colors">Log in</Link>
            <Link to="/signup" className="px-5 py-2.5 rounded-full gradient-primary text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple/25 hover:-translate-y-0.5 transition-all">Sign up</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function LandingFooter() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/landing" className="flex items-center">
            <img src="https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp" alt="Lincc" className="h-10" />
          </Link>
          <div className="flex items-center gap-6 text-text-muted">
            <Link to="/landing/about" className="hover:text-purple transition-colors">About</Link>
            <Link to="/landing/privacy" className="hover:text-purple transition-colors">Privacy</Link>
            <Link to="/landing/terms" className="hover:text-purple transition-colors">Terms</Link>
            <Link to="/landing/contact" className="hover:text-purple transition-colors">Contact</Link>
          </div>
          <p className="text-text-light text-sm">&copy; 2026 Lincc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
