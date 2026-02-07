import { Link } from 'react-router-dom';
import { Zap, MapPin, Shield, Eye, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">About Us</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            We're building your
            <br />
            <span className="gradient-text">local pulse</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            One place to discover everything happening around you.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="prose prose-lg text-gray-600">
            <p className="text-xl leading-relaxed">
              We started Lincc because finding out what's happening around you shouldn't
              be this hard. You check Instagram, Google, maybe five different apps — and
              you still miss half of it. There had to be a better way.
            </p>
            <p className="leading-relaxed">
              Lincc brings everything together in one place. Events, deals, openings,
              happenings — all live, all local, all at your fingertips. Whether it's a
              nightclub opening, a restaurant running a limited-time offer, a pop-up market,
              or a community event — if it's happening near you, it's on Lincc.
            </p>
            <p className="leading-relaxed">
              We're not just another events app. We're building the go-to destination for
              discovering your area — a real-time feed of everything worth knowing about,
              filtered to exactly when and where you want.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What we believe</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <ValueCard icon={<Zap className="h-6 w-6" />} title="Real-time or nothing" description="Stale information is useless. Everything on Lincc is live and current — if it's expired, it's gone." />
            <ValueCard icon={<MapPin className="h-6 w-6" />} title="Local first" description="Your area is full of amazing things — you just don't know about them yet. Lincc surfaces what's nearby." />
            <ValueCard icon={<Eye className="h-6 w-6" />} title="Everything in one place" description="No more jumping between apps, websites, and social feeds. One app for events, deals, and everything else." />
            <ValueCard icon={<Shield className="h-6 w-6" />} title="Trust & quality" description="Verified businesses and vetted listings mean you can trust what you see." />
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to join us?</h2>
          <p className="text-lg text-gray-600 mb-8">
            We're launching soon. Be the first to discover everything happening around you.
          </p>
          <Link
            to="/landing#waitlist"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full gradient-primary text-white font-semibold text-lg hover:shadow-xl hover:shadow-purple/30 transition-all group"
          >
            Join the Waitlist
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

function ValueCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
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
