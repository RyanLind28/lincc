import { Link } from 'react-router-dom';
import { Mail, MapPin, ArrowRight } from 'lucide-react';
import Footer from '../components/Footer';

function Logo({ className = "text-2xl" }: { className?: string }) {
  return (
    <span className={`font-bold gradient-text ${className}`}>
      lincc
    </span>
  );
}

export default function Contact() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <Logo className="text-3xl" />
            </Link>
            <a
              href="/#waitlist"
              className="px-5 py-2.5 rounded-full gradient-primary text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple/25 transition-all"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* Content */}
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
              <p className="text-gray-600 mb-4">
                For general inquiries and support
              </p>
              <a
                href="mailto:hello@lincc.app"
                className="text-purple font-semibold hover:underline"
              >
                hello@lincc.app
              </a>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Follow Us</h2>
              <p className="text-gray-600 mb-4">
                Stay updated on our launch
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-purple font-semibold hover:underline">Twitter</a>
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
            <div className="text-center">
              <a
                href="/#waitlist"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full gradient-primary text-white font-semibold hover:shadow-xl hover:shadow-purple/30 transition-all group"
              >
                Join the Waitlist
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
