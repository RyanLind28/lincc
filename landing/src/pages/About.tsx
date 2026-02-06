import { Link } from 'react-router-dom';
import { Heart, Users, Shield, Zap, ArrowRight } from 'lucide-react';

function Logo({ className = "text-2xl" }: { className?: string }) {
  return (
    <span className={`font-bold gradient-text ${className}`}>
      lincc
    </span>
  );
}

export default function About() {
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

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">About Us</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            We're building the
            <br />
            <span className="gradient-text">anti-social network</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            A place that gets you off your phone and into the world.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="prose prose-lg text-gray-600">
            <p className="text-xl leading-relaxed">
              We started Lincc because we noticed something broken. Despite being more
              "connected" than ever, people are lonelier than ever. We have thousands of
              online friends but struggle to find someone to grab coffee with.
            </p>

            <p className="leading-relaxed">
              The problem isn't technology — it's how we use it. Social apps keep us
              scrolling, swiping, and messaging, but rarely meeting. Lincc flips the script.
              We're designed to get you offline and into real experiences with real people.
            </p>

            <p className="leading-relaxed">
              No infinite feeds. No vanity metrics. No endless chat threads that go nowhere.
              Just spontaneous activities happening near you, right now, with people who
              actually want to show up.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What we believe</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real over digital</h3>
              <p className="text-gray-600">
                The best connections happen face-to-face. We optimize for in-person
                experiences, not screen time.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Spontaneity wins</h3>
              <p className="text-gray-600">
                "Let's hang out sometime" never happens. Events on Lincc happen within
                24 hours — because the best plans are made now.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Small is beautiful</h3>
              <p className="text-gray-600">
                You can't have a real conversation with 50 people. Our events are
                capped at small sizes for meaningful connections.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Safety first</h3>
              <p className="text-gray-600">
                Real-world meetups need trust. Hosts approve participants, and we
                offer women-only events and other safety features.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to join us?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            We're launching soon. Be the first to experience a new way to connect.
          </p>
          <a
            href="/#waitlist"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full gradient-primary text-white font-semibold text-lg hover:shadow-xl hover:shadow-purple/30 transition-all group"
          >
            Join the Waitlist
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center">
            <Logo className="text-2xl" />
          </Link>
          <div className="flex items-center gap-6 text-gray-600 text-sm">
            <Link to="/about" className="hover:text-purple transition-colors">About</Link>
            <Link to="/privacy" className="hover:text-purple transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-purple transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-purple transition-colors">Contact</Link>
          </div>
          <p className="text-gray-500 text-sm">© 2026 Lincc</p>
        </div>
      </footer>
    </div>
  );
}
