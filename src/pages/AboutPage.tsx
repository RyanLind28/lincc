import { Link } from 'react-router-dom';
import { Header } from '../components/layout';
import { Zap, MapPin, Shield, Eye, ArrowRight, Compass, Plus } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <Header title="About" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Hero */}
        <section className="bg-surface rounded-2xl border border-border p-6 sm:p-8 text-center">
          <p className="text-purple font-semibold text-xs uppercase tracking-wider mb-3">
            About Lincc
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            Your <span className="gradient-text">local pulse</span>
          </h1>
          <p className="text-base sm:text-lg text-text-muted leading-relaxed">
            One place to discover everything happening around you.
          </p>
        </section>

        {/* Story */}
        <section className="bg-surface rounded-2xl border border-border p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-text">Why we built Lincc</h2>
          <p className="text-text-muted leading-relaxed">
            Finding out what's happening around you shouldn't be this hard. You
            check Instagram, Google, maybe five different apps, and still miss
            half of it. There had to be a better way.
          </p>
          <p className="text-text-muted leading-relaxed">
            Lincc brings everything together: events, deals, openings,
            happenings. All live, all local, all in one place. Whether it's a
            nightclub opening, a restaurant offer, a pop-up market, or a
            community meetup. If it's happening near you, it's on Lincc.
          </p>
          <p className="text-text-muted leading-relaxed">
            We're building the go-to destination for discovering your area: a
            real-time feed of everything worth knowing about, filtered to exactly
            when and where you want.
          </p>
        </section>

        {/* Values */}
        <section>
          <h2 className="text-xl font-bold text-text mb-4 px-1">What we believe</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <ValueCard
              icon={<Zap className="h-5 w-5" />}
              title="Real-time or nothing"
              description="Stale information is useless. Everything on Lincc is live and current. If it's expired, it's gone."
            />
            <ValueCard
              icon={<MapPin className="h-5 w-5" />}
              title="Local first"
              description="Your area is full of amazing things you just don't know about yet. Lincc surfaces what's nearby."
            />
            <ValueCard
              icon={<Eye className="h-5 w-5" />}
              title="Everything in one place"
              description="No more jumping between apps, websites, and social feeds. One app for events, deals, and everything else."
            />
            <ValueCard
              icon={<Shield className="h-5 w-5" />}
              title="Trust & quality"
              description="Verified businesses and vetted listings mean you can trust what you see."
            />
          </div>
        </section>

        {/* In-app CTAs */}
        <section className="bg-surface rounded-2xl border border-border p-6 sm:p-8">
          <h2 className="text-xl font-bold text-text mb-4">Get started</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link
              to="/explore"
              className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-purple/40 hover:bg-purple/5 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center flex-shrink-0">
                <Compass className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-text">Explore what's nearby</p>
                <p className="text-sm text-text-muted">Find events, deals, and openings around you</p>
              </div>
              <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-purple group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/event/new"
              className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-coral/40 hover:bg-coral/5 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-coral flex items-center justify-center flex-shrink-0">
                <Plus className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-text">Create an event</p>
                <p className="text-sm text-text-muted">Host something in under 30 seconds</p>
              </div>
              <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-coral group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </section>

        {/* Footer links: plain in-app links, no external feel */}
        <section className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-text-muted pt-2">
          <Link to="/landing/privacy" className="hover:text-purple transition-colors">Privacy</Link>
          <Link to="/landing/terms" className="hover:text-purple transition-colors">Terms</Link>
          <Link to="/contact" className="hover:text-purple transition-colors">Contact</Link>
        </section>

        <p className="text-center text-xs text-text-light">&copy; 2026 Lincc</p>
      </main>
    </div>
  );
}

function ValueCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-surface rounded-2xl p-5 border border-border">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-text mb-1">{title}</h3>
      <p className="text-sm text-text-muted leading-relaxed">{description}</p>
    </div>
  );
}
