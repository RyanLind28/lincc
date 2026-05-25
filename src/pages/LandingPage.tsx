import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  MapPin,
  Sparkles,
  Coffee,
  Music,
  Store,
  ChevronRight,
  Clock,
  Tag,
  PartyPopper,
  Utensils,
  Dumbbell,
  Heart,
  Palette,
  TreePine,
  Trophy,
  Wine,
  ShoppingBag,
  Drama,
  ArrowRight,
  Check,
  Loader2,
  Instagram,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

function Logo({ className = "h-9" }: { className?: string }) {
  return (
    <img
      src="https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp"
      alt="Lincc"
      className={className}
    />
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface">
      {/* Navigation */}
      <header>
      <nav className="fixed top-0 left-0 right-0 z-[var(--z-header)] bg-surface/80 backdrop-blur-md border-b border-border" aria-label="Landing page navigation">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <Logo className="h-10" />
            </Link>
            <a
              href="#waitlist"
              className="px-5 py-2.5 rounded-full gradient-primary text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple/25 hover:-translate-y-0.5 transition-all"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>
      </header>

      <main>
      {/* Hero Section */}
      <section className="pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 relative overflow-x-clip overflow-y-visible">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-coral/10 via-purple/10 to-blue/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-coral/10 to-purple/10 text-purple font-medium text-sm mb-6">
              Everything local, in one place
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-text mb-6 leading-tight">
              Your area,
              <br />
              <span className="gradient-text">
                at your fingertips
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-text-muted mb-8 max-w-2xl mx-auto leading-relaxed">
              Events, deals, openings, and happenings near you. All live, all in one place.
              No more endless scrolling. Just open Lincc and go.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#waitlist"
                className="w-full sm:w-auto px-8 py-4 rounded-full gradient-primary text-white font-semibold text-lg hover:shadow-xl hover:shadow-purple/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
              >
                Get Early Access
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <p className="text-sm text-text-muted mt-4">
              Be first to know when we launch.
            </p>
          </div>

          {/* App Preview */}
          <div className="mt-12 sm:mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent z-10 pointer-events-none" />
            {/* Desktop: grid layout */}
            <div className="hidden sm:block bg-gradient-to-br from-coral/5 via-purple/5 to-blue/10 rounded-3xl p-6 sm:p-8 lg:p-12 border border-border">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <EventCard
                  icon={<Coffee className="h-5 w-5 text-white" />}
                  category="Coffee"
                  title="Morning Coffee & Chat"
                  venue="Brew & Co, Shoreditch"
                  time="Today at 10 AM"
                  detail="2 spots left"
                />
                <EventCard
                  icon={<Tag className="h-5 w-5 text-white" />}
                  category="Offer"
                  title="50% Off Brunch Menu"
                  venue="The Garden Kitchen"
                  time="This weekend"
                  detail="Use code LINCC50"
                />
                <EventCard
                  icon={<PartyPopper className="h-5 w-5 text-white" />}
                  category="Nightlife"
                  title="Grand Opening Night"
                  venue="Club Paradiso"
                  time="Tonight at 10 PM"
                  detail="Free entry before 11"
                  className="hidden lg:block"
                />
              </div>
            </div>

            {/* Mobile: horizontal scroll */}
            <div className="sm:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-3">
              <div className="flex gap-4 w-max">
                <div className="w-[280px] shrink-0 snap-start">
                  <EventCard icon={<Coffee className="h-5 w-5 text-white" />} category="Coffee" title="Morning Coffee & Chat" venue="Brew & Co, Shoreditch" time="Today at 10 AM" detail="2 spots left" />
                </div>
                <div className="w-[280px] shrink-0 snap-start">
                  <EventCard icon={<Tag className="h-5 w-5 text-white" />} category="Offer" title="50% Off Brunch Menu" venue="The Garden Kitchen" time="This weekend" detail="Use code LINCC50" />
                </div>
                <div className="w-[280px] shrink-0 snap-start">
                  <EventCard icon={<PartyPopper className="h-5 w-5 text-white" />} category="Nightlife" title="Grand Opening Night" venue="Club Paradiso" time="Tonight at 10 PM" detail="Free entry before 11" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
              How Lincc Works
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Three steps to never miss what's happening again
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <StepCard number="1" title="See what's on" description="Open Lincc and instantly see everything happening around you. Events, deals, openings, meetups, and more." />
            <StepCard number="2" title="Find your vibe" description="Narrow it down to what suits you, by time, place, or interest. From tonight's plans to this weekend's events." />
            <StepCard number="3" title="Get out there" description="Grab a deal, join an event, or try something new. Everything you need to go is right here." />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
              Your social life, <span className="gradient-text">sorted.</span>
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              One place for everything going on around you. No more FOMO.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
            <FeatureCard icon={<Heart className="h-6 w-6" />} title="New connections" description="Find a coffee buddy, a running partner, a co-working crew, or a whole new circle. Meet people doing what you love." />
            <FeatureCard icon={<Sparkles className="h-6 w-6" />} title="New things to do" description="Pop-up markets, open mic nights, food festivals, club openings. Discover things you never knew were happening." />
            <FeatureCard icon={<Tag className="h-6 w-6" />} title="Exclusive deals" description="Offers and discounts from local restaurants, bars, and shops, only on Lincc." />
            <FeatureCard icon={<Clock className="h-6 w-6" />} title="Always something on" description="Live, real-time events updated around the clock. Whether it's tonight or this weekend, there's always a plan." />
            <FeatureCard icon={<MapPin className="h-6 w-6" />} title="Right on your doorstep" description="See what's within walking distance or explore further out. Your area is more interesting than you think." />
            <FeatureCard icon={<Store className="h-6 w-6" />} title="Support local" description="Discover independent restaurants, shops, and venues in your neighbourhood. Keep it local." />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
              Whatever You're Looking For
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              From nightlife to brunch deals, it's all here
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {([
              { name: 'Nightlife & Clubs', Icon: PartyPopper },
              { name: 'Food & Dining', Icon: Utensils },
              { name: 'Live Music', Icon: Music },
              { name: 'Happy Hour', Icon: Wine },
              { name: 'Fitness & Wellness', Icon: Dumbbell },
              { name: 'Markets & Pop-ups', Icon: ShoppingBag },
              { name: 'Coffee & Brunch', Icon: Coffee },
              { name: 'Art & Exhibitions', Icon: Palette },
              { name: 'Comedy & Shows', Icon: Drama },
              { name: 'Outdoor & Adventure', Icon: TreePine },
              { name: 'Sports & Recreation', Icon: Trophy },
              { name: 'Restaurant Deals', Icon: Tag },
              { name: 'Shop Promotions', Icon: Store },
              { name: 'Grand Openings', Icon: Sparkles },
              { name: 'Community Events', Icon: Heart },
            ] as { name: string; Icon: LucideIcon }[]).map((category) => (
              <span
                key={category.name}
                className="px-4 py-2.5 rounded-full bg-surface border border-border text-text font-medium hover:border-purple hover:text-purple hover:bg-purple/5 transition-all cursor-default flex items-center gap-2 text-sm"
              >
                <category.Icon className="h-4 w-4" />
                {category.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* For Businesses */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-primary rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6">
                <Store className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Got a business?
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Reach local customers instantly. Post events, share offers, and drive
                foot traffic, all from one dashboard.
              </p>
              <a
                href="#waitlist"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-surface text-purple font-semibold text-lg hover:shadow-xl transition-all group"
              >
                Register Interest
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-purple-dark font-semibold text-sm uppercase tracking-wider mb-3">Join the waitlist</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
            Be first in line
          </h2>
          <p className="text-lg text-text-muted mb-10">
            We're launching soon. Get early access and never miss what's happening around you again.
          </p>
          <WaitlistForm />
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div>
              <Logo className="h-10 mb-4" />
              <p className="text-sm text-text-muted max-w-xs">
                Everything happening around you, in one place. Events, deals, openings, and more.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">Links</h3>
              <div className="flex flex-col gap-2 text-sm text-text-muted">
                <Link to="/landing/about" className="hover:text-purple transition-colors">About</Link>
                <Link to="/landing/privacy" className="hover:text-purple transition-colors">Privacy</Link>
                <Link to="/landing/terms" className="hover:text-purple transition-colors">Terms</Link>
                <Link to="/landing/contact" className="hover:text-purple transition-colors">Contact</Link>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text mb-3">Follow us</h3>
              <div className="flex items-center gap-3">
                <a href="https://www.instagram.com/lincc_live" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-text-muted hover:text-coral hover:bg-coral/10 transition-colors" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="https://www.tiktok.com/@lincc_live" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-text-muted hover:text-coral hover:bg-coral/10 transition-colors" aria-label="TikTok">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.83 4.83 0 0 1-1-.15z"/></svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-text-light text-sm">
              &copy; 2026 Lincc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Sub-components

function EventCard({
  icon,
  category,
  title,
  venue,
  time,
  detail,
  className = '',
}: {
  icon: React.ReactNode;
  category: string;
  title: string;
  venue: string;
  time: string;
  detail: string;
  className?: string;
}) {
  return (
    <div className={`bg-surface rounded-2xl p-5 shadow-sm border border-border hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          {icon}
        </div>
        <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-coral/10 to-purple/10 text-purple text-xs font-medium">
          {category}
        </span>
      </div>
      <p className="font-semibold text-text mb-1">{title}</p>
      <p className="text-sm text-text-light mb-3">{venue}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-purple font-medium">{time}</span>
        <span className="text-coral font-medium">{detail}</span>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-surface rounded-2xl p-8 text-center border border-border shadow-sm">
      <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mx-auto mb-5">
        <span className="text-xl font-bold text-white">{number}</span>
      </div>
      <h3 className="text-xl font-semibold text-text mb-3">{title}</h3>
      <p className="text-text-muted leading-relaxed">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-surface rounded-2xl p-6 border border-border hover:border-coral/30 hover:shadow-md transition-all group">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4 group-hover:from-coral group-hover:to-purple group-hover:text-white transition-all">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      <p className="text-text-muted text-sm leading-relaxed">{description}</p>
    </div>
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

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (supabaseUrl) {
        void fetch(`${supabaseUrl}/functions/v1/send-waitlist-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email, name }),
        }).catch((err) => {
          if (import.meta.env.DEV) console.warn('Waitlist email send failed:', err);
        });
      }
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-surface rounded-2xl p-8 shadow-lg max-w-md mx-auto text-center border border-border">
        <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
          <Check className="h-7 w-7 text-success" />
        </div>
        <h3 className="text-2xl font-semibold text-text mb-2">You're on the list!</h3>
        <p className="text-text-muted">
          We'll notify you as soon as Lincc is ready.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-2xl p-6 sm:p-8 shadow-lg max-w-md mx-auto border border-border">
      <div className="space-y-4">
        <div>
          <label htmlFor="wl-name" className="block text-sm font-medium text-text mb-1.5">
            Name
          </label>
          <input
            type="text"
            id="wl-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="w-full h-[var(--height-input)] px-4 rounded-xl border border-border bg-surface text-text placeholder:text-text-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:border-transparent transition-colors"
          />
        </div>
        <div>
          <label htmlFor="wl-email" className="block text-sm font-medium text-text mb-1.5">
            Email
          </label>
          <input
            type="email"
            id="wl-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full h-[var(--height-input)] px-4 rounded-xl border border-border bg-surface text-text placeholder:text-text-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:border-transparent transition-colors"
          />
        </div>
        {status === 'error' && (
          <p className="text-error text-sm bg-error/10 px-4 py-2 rounded-xl">{errorMessage}</p>
        )}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full h-[var(--height-button-lg)] rounded-full gradient-primary text-white font-semibold text-lg hover:shadow-lg hover:shadow-purple/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
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
      <p className="mt-4 text-xs text-text-light text-center">
        We'll only email you when we launch.
      </p>
    </form>
  );
}
