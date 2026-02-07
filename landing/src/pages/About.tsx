import { Link } from 'react-router-dom';
import { Zap, MapPin, Shield, Eye, ArrowRight } from 'lucide-react';
import Footer from '../components/Footer';

const LOGO_URL = 'https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp';

function Logo({ className = "h-8" }: { className?: string }) {
  return <img src={LOGO_URL} alt="Lincc" className={className} />;
}

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <Logo className="h-10" />
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
            We're building your
            <br />
            <span className="gradient-text">local pulse</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            One place to discover everything happening around you.
          </p>
        </div>
      </section>

      {/* Story */}
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
              filtered to exactly when and where you want. No endless scrolling. No searching
              for hours. Just open the app and see what's on.
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
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time or nothing</h3>
              <p className="text-gray-600">
                Stale information is useless. Everything on Lincc is live and current —
                if it's expired, it's gone. You only see what's actually happening.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Local first</h3>
              <p className="text-gray-600">
                Your area is full of amazing things — you just don't know about them yet.
                Lincc surfaces what's nearby so you can stop searching and start exploring.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Everything in one place</h3>
              <p className="text-gray-600">
                No more jumping between apps, websites, and social feeds. One app for events,
                deals, openings, and everything else worth knowing about.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Trust & quality</h3>
              <p className="text-gray-600">
                Verified businesses and vetted listings mean you can trust what you see.
                No spam, no clickbait — just genuine events and offers.
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
            We're launching soon. Be the first to discover everything happening around you.
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

      <Footer />
    </div>
  );
}
