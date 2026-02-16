import { Link } from 'react-router-dom';
import {
  MapPin,
  Sparkles,
  Coffee,
  Music,
  Store,
  Globe,
  ArrowRight,
  Check,
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
  type LucideIcon,
} from 'lucide-react';
import WaitlistForm from '../components/WaitlistForm';

const LOGO_URL = 'https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp';

function Logo({ className = "h-8", white = false, priority = false }: { className?: string; white?: boolean; priority?: boolean }) {
  return (
    <img
      src={LOGO_URL}
      alt="Lincc"
      className={`${className} ${white ? 'brightness-0 invert' : ''}`}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white overflow-x-clip">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <Logo className="h-10" priority />
            </Link>
            <div className="hidden sm:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#how-it-works" className="hover:text-purple transition-colors">How it works</a>
              <a href="#features" className="hover:text-purple transition-colors">Features</a>
              <a href="#businesses" className="hover:text-purple transition-colors">For Businesses</a>
              <Link to="/about" className="hover:text-purple transition-colors">About</Link>
            </div>
            <a
              href="#waitlist"
              className="px-5 py-2.5 rounded-full gradient-primary text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple/25 hover:-translate-y-0.5 transition-all"
            >
              Get Early Access
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 relative">
        {/* Background decorations */}
        <div className="absolute top-20 left-0 w-72 h-72 bg-coral/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute top-40 right-0 w-96 h-96 bg-purple/20 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue/15 rounded-full blur-[100px] -z-10" />

        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-coral/10 via-purple/10 to-blue/10 border border-purple/20 text-purple font-medium text-sm mb-8 animate-fade-in">
              <Sparkles className="h-4 w-4 text-coral" />
              Coming Soon — Join the waitlist
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight">
              No Algorithms.
              <br />
              <span className="gradient-text">Just what's happening now</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Tired of Instagram showing you last week's posts when you want to know what's on tonight? Lincc is different. Everything you see is happening now or soon, in the order it was posted. No algorithms choosing for you.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <a
                href="#waitlist"
                className="w-full sm:w-auto px-8 py-4 rounded-full gradient-primary text-white font-semibold text-lg hover:shadow-xl hover:shadow-purple/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
              >
                Get Early Access
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
            <p className="text-sm text-gray-500">
              Be first to know when we launch.
            </p>
          </div>

          {/* App Preview */}
          <div className="mt-16 sm:mt-20 relative">
            {/* Glow effect behind cards */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple/5 to-transparent rounded-3xl" />

            {/* Desktop: grid layout (hidden on mobile) */}
            <div className="hidden sm:block bg-gradient-to-br from-gray-50 to-white rounded-3xl p-10 border border-gray-200/60 shadow-2xl shadow-gray-200/50">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <EventCard
                  icon={<Wine className="h-5 w-5 text-white" />}
                  category="Flash Sale"
                  title="Half-price cocktails"
                  venue="Skybar"
                  time="Next 2 hours only"
                  detail="50% off"
                  gradient="from-coral to-purple"
                />
                <EventCard
                  icon={<PartyPopper className="h-5 w-5 text-white" />}
                  category="Social"
                  title="Board games night at mine"
                  venue="Hackney"
                  time="7pm tonight"
                  detail="3 spots left"
                  gradient="from-purple to-blue"
                />
                <EventCard
                  icon={<Coffee className="h-5 w-5 text-white" />}
                  category="Meetup"
                  title="Morning run & coffee"
                  venue="Victoria Park"
                  time="Tomorrow 7am"
                  detail="All levels welcome"
                  gradient="from-amber-500 to-orange-500"
                />
              </div>
            </div>

            {/* Mobile: horizontal scroll (hidden on desktop) */}
            <div className="sm:hidden">
              <div
                className="scrollbar-hide"
                style={{
                  display: 'flex',
                  gap: '16px',
                  overflowX: 'auto',
                  scrollSnapType: 'x mandatory',
                  paddingBottom: '8px',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <EventCard
                  icon={<Wine className="h-5 w-5 text-white" />}
                  category="Flash Sale"
                  title="Half-price cocktails"
                  venue="Skybar"
                  time="Next 2 hours only"
                  detail="50% off"
                  gradient="from-coral to-purple"
                  className="w-[280px] !shrink-0"
                  style={{ scrollSnapAlign: 'center', flexShrink: 0, minWidth: '280px' }}
                />
                <EventCard
                  icon={<PartyPopper className="h-5 w-5 text-white" />}
                  category="Social"
                  title="Board games night at mine"
                  venue="Hackney"
                  time="7pm tonight"
                  detail="3 spots left"
                  gradient="from-purple to-blue"
                  className="w-[280px] !shrink-0"
                  style={{ scrollSnapAlign: 'center', flexShrink: 0, minWidth: '280px' }}
                />
                <EventCard
                  icon={<Coffee className="h-5 w-5 text-white" />}
                  category="Meetup"
                  title="Morning run & coffee"
                  venue="Victoria Park"
                  time="Tomorrow 7am"
                  detail="All levels welcome"
                  gradient="from-amber-500 to-orange-500"
                  className="w-[280px] !shrink-0"
                  style={{ scrollSnapAlign: 'center', flexShrink: 0, minWidth: '280px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Lincc - The Problem */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">Why Lincc</p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Real-Time. Chronological. Unfiltered.
          </h2>
          <p className="text-xl sm:text-2xl font-semibold gradient-text">
            Your social life, sorted.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Your area, at your
              <br />
              <span className="gradient-text">fingertips</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
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

      {/* Features Grid */}
      <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything you need,
              <br />
              <span className="gradient-text">one place.</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4">
              Events, deals, meetups, and local happenings — all in your pocket.
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

      {/* For Businesses */}
      <section id="businesses" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">For Businesses</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Reach customers
                <br />
                <span className="gradient-text">when it matters</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Whether you're a restaurant, bar, shop, or venue — Lincc puts your events,
                offers, and promotions in front of people who are nearby and ready to go.
              </p>
              <div className="space-y-4">
                {[
                  'Post events, offers & promotions instantly',
                  'Reach people within walking distance',
                  'Drive foot traffic with time-limited deals',
                  'Track engagement and redemptions',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 gradient-primary rounded-3xl blur-3xl opacity-20" />
              <div className="relative bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Business card examples */}
                <div className="p-6 space-y-4">
                  <BusinessCard
                    icon={<Utensils className="h-5 w-5 text-white" />}
                    name="The Garden Kitchen"
                    type="Restaurant"
                    offer="50% off lunch menu — Today only"
                    gradient="from-amber-500 to-orange-500"
                  />
                  <BusinessCard
                    icon={<Coffee className="h-5 w-5 text-white" />}
                    name="Brew & Co"
                    type="Coffee Shop"
                    offer="Free pastry with any coffee before 10am"
                    gradient="from-coral to-purple"
                  />
                  <BusinessCard
                    icon={<Store className="h-5 w-5 text-white" />}
                    name="Urban Threads"
                    type="Boutique"
                    offer="New collection launch — 20% off this weekend"
                    gradient="from-purple to-blue"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">Categories</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Whatever you're looking for
            </h2>
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
              { name: 'Community Events', Icon: Heart },
              { name: 'Restaurant Deals', Icon: Tag },
              { name: 'Shop Promotions', Icon: Store },
              { name: 'Grand Openings', Icon: Sparkles },
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

      {/* The Problem */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">The Problem</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Stop searching.
                <br />
                <span className="gradient-text">Start discovering.</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                How do you find out what's happening tonight? You check Instagram, Google,
                maybe five different apps — and still miss half of it. Lincc brings it all
                together. One place. Always up to date. Always local.
              </p>
              <div className="space-y-4">
                {[
                  'Posted in order, not by engagement',
                  "See what's on now, not last week",
                  'Local first — your area, your feed',
                  'No algorithm deciding what you see',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                      <Check className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 gradient-primary rounded-3xl blur-3xl opacity-20" />
              <div className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center">
                    <Globe className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">Launching Soon</h3>
                    <p className="text-gray-500">Be the first to know</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-6">
                  We're building the go-to app for discovering everything happening
                  in your area. Join the waitlist to get early access.
                </p>
                <a
                  href="#waitlist"
                  className="inline-flex items-center gap-2 text-purple font-semibold hover:gap-3 transition-all"
                >
                  Join the waitlist
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="gradient-primary rounded-3xl p-8 sm:p-12 lg:p-16 text-white text-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-32 bg-white/5 rotate-12" />

            <div className="relative z-10">
              <Logo className="h-14 mb-6" white />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Your city. Your scene.
                <br />
                All in one place.
              </h2>
              <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-xl mx-auto">
                Events, offers, openings, happenings — everything that matters, right at your fingertips.
              </p>
              <a
                href="#waitlist"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-purple font-semibold text-lg hover:shadow-xl hover:-translate-y-0.5 transition-all group"
              >
                Get Early Access
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Form */}
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
      <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Logo className="h-10 mb-4" />
              <p className="text-gray-500 text-sm">
                Everything local,
                <br />
                at your fingertips.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#how-it-works" className="hover:text-purple transition-colors">How it works</a></li>
                <li><a href="#features" className="hover:text-purple transition-colors">Features</a></li>
                <li><a href="#businesses" className="hover:text-purple transition-colors">For Businesses</a></li>
                <li><a href="#waitlist" className="hover:text-purple transition-colors">Join waitlist</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-3 text-gray-600">
                <li><Link to="/about" className="hover:text-purple transition-colors">About</Link></li>
                <li><Link to="/contact" className="hover:text-purple transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-3 text-gray-600">
                <li><Link to="/privacy" className="hover:text-purple transition-colors">Privacy</Link></li>
                <li><Link to="/terms" className="hover:text-purple transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              &copy; 2026 Lincc. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-purple transition-colors">
                <span className="sr-only">X</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-purple transition-colors">
                <span className="sr-only">Instagram</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"/></svg>
              </a>
            </div>
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
  gradient = "from-coral to-purple",
  className = '',
  style,
}: {
  icon: React.ReactNode;
  category: string;
  title: string;
  venue: string;
  time: string;
  detail: string;
  gradient?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg border border-gray-100 transition-all hover:-translate-y-1 ${className}`} style={style}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
        <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
          {category}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 text-lg mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{venue}</p>
      <div className="flex items-center justify-between text-sm">
        <span className="text-purple font-medium">{time}</span>
        <span className="text-coral font-medium">{detail}</span>
      </div>
    </div>
  );
}

function BusinessCard({
  icon,
  name,
  type,
  offer,
  gradient = "from-coral to-purple",
}: {
  icon: React.ReactNode;
  name: string;
  type: string;
  offer: string;
  gradient?: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-purple/20 transition-colors">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-gray-900 truncate">{name}</p>
          <span className="px-2 py-0.5 rounded-full bg-purple/10 text-purple text-xs font-medium flex-shrink-0">{type}</span>
        </div>
        <p className="text-sm text-gray-600 truncate">{offer}</p>
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
    <div className="text-center">
      <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
        <span className="text-2xl font-bold text-white">{number}</span>
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
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
    <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-purple/20 hover:shadow-lg hover:shadow-purple/5 transition-all group">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4 group-hover:from-coral group-hover:to-purple group-hover:text-white transition-all">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
