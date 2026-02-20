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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-x-clip overflow-y-visible">
        {/* Background gradient decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-coral/10 via-purple/10 to-blue/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-coral/10 to-purple/10 text-purple font-medium text-sm mb-6">
              Everything local, in one place
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Your area,
              <br />
              <span className="gradient-text">
                at your fingertips
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Events, deals, openings, and happenings near you — all live, all in one place.
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
            <p className="text-sm text-gray-500 mt-4">
              Be first to know when we launch.
            </p>
          </div>

          {/* App Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            {/* Desktop: grid layout */}
            <div className="hidden sm:block bg-gradient-to-br from-coral/5 via-purple/5 to-blue/10 rounded-3xl p-8 sm:p-12 border border-gray-100">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <EventCard
                    icon={<Coffee className="h-5 w-5 text-white" />}
                    category="Coffee"
                    title="Morning Coffee & Chat"
                    venue="Brew & Co, Shoreditch"
                    time="Today at 10 AM"
                    detail="2 spots left"
                  />
                </div>
                <div className="w-[280px] shrink-0 snap-start">
                  <EventCard
                    icon={<Tag className="h-5 w-5 text-white" />}
                    category="Offer"
                    title="50% Off Brunch Menu"
                    venue="The Garden Kitchen"
                    time="This weekend"
                    detail="Use code LINCC50"
                  />
                </div>
                <div className="w-[280px] shrink-0 snap-start">
                  <EventCard
                    icon={<PartyPopper className="h-5 w-5 text-white" />}
                    category="Nightlife"
                    title="Grand Opening Night"
                    venue="Club Paradiso"
                    time="Tonight at 10 PM"
                    detail="Free entry before 11"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How Lincc Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three steps to never miss what's happening again
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title="See what's on"
              description="Open Lincc and instantly see everything happening around you — events, deals, openings, meetups, and more."
            />
            <StepCard
              number="2"
              title="Find your vibe"
              description="Narrow it down to what suits you — by time, place, or interest. From tonight's plans to this weekend's events."
            />
            <StepCard
              number="3"
              title="Get out there"
              description="Grab a deal, join an event, or try something new. Everything you need to go is right here."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Your social life, <span className="gradient-text">sorted.</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              One place for everything going on around you. No more FOMO.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Heart className="h-6 w-6" />}
              title="New connections"
              description="Find a coffee buddy, a running partner, a co-working crew, or a whole new circle. Meet people doing what you love."
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="New things to do"
              description="Pop-up markets, open mic nights, food festivals, club openings — discover things you never knew were happening."
            />
            <FeatureCard
              icon={<Tag className="h-6 w-6" />}
              title="Exclusive deals"
              description="Offers and discounts from local restaurants, bars, and shops — only on Lincc."
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="Always something on"
              description="Live, real-time events updated around the clock. Whether it's tonight or this weekend, there's always a plan."
            />
            <FeatureCard
              icon={<MapPin className="h-6 w-6" />}
              title="Right on your doorstep"
              description="See what's within walking distance or explore further out. Your area is more interesting than you think."
            />
            <FeatureCard
              icon={<Store className="h-6 w-6" />}
              title="Support local"
              description="Discover independent restaurants, shops, and venues in your neighbourhood. Keep it local."
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Whatever You're Looking For
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From nightlife to brunch deals — it's all here
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
                className="px-4 py-2.5 rounded-full bg-white border border-gray-200 text-gray-700 font-medium hover:border-purple hover:text-purple hover:bg-purple/5 transition-all cursor-default flex items-center gap-2"
              >
                <category.Icon className="h-4 w-4" />
                {category.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* For Businesses */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-primary rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden">
            {/* Decorative elements */}
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
                foot traffic — all from one dashboard.
              </p>
              <a
                href="#waitlist"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-purple font-semibold text-lg hover:shadow-xl transition-all group"
              >
                Register Interest
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">Join the waitlist</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Be first in line
          </h2>
          <p className="text-lg text-gray-600 mb-10">
            We're launching soon. Get early access and never miss what's happening around you again.
          </p>
          <WaitlistForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center">
              <Logo className="h-10" />
            </Link>
            <div className="flex items-center gap-6 text-gray-600">
              <Link to="/landing/about" className="hover:text-purple transition-colors">About</Link>
              <Link to="/landing/privacy" className="hover:text-purple transition-colors">Privacy</Link>
              <Link to="/landing/terms" className="hover:text-purple transition-colors">Terms</Link>
              <Link to="/landing/contact" className="hover:text-purple transition-colors">Contact</Link>
            </div>
            <p className="text-gray-500 text-sm">
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
    <div className={`bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          {icon}
        </div>
        <span className="px-2 py-1 rounded-full bg-gradient-to-r from-coral/10 to-purple/10 text-purple text-xs font-medium">
          {category}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-3">{venue}</p>
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
    <div className="bg-white rounded-2xl p-6 text-center">
      <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl font-bold text-white">{number}</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
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
    <div className="bg-gray-50 rounded-2xl p-6 hover:bg-gradient-to-br hover:from-coral/5 hover:to-purple/5 transition-all group">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4 group-hover:from-coral group-hover:to-purple group-hover:text-white transition-all">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
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
          We'll notify you as soon as Lincc is ready.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-lg max-w-md mx-auto border border-gray-100">
      <div className="space-y-5">
        <div>
          <label htmlFor="wl-name" className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            id="wl-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:border-purple focus:ring-2 focus:ring-purple/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <div>
          <label htmlFor="wl-email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            id="wl-email"
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
        We'll only email you when we launch.
      </p>
    </form>
  );
}
