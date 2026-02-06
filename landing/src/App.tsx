import {
  Users,
  MapPin,
  Calendar,
  MessageCircle,
  Shield,
  Sparkles,
  Coffee,
  Dumbbell,
  Gamepad2,
  ChevronRight,
} from 'lucide-react';

// Get the main app URL from environment variable
const APP_URL = import.meta.env.VITE_APP_URL || 'https://app.lincc.com';

// Logo component - text-based with gradient
function Logo({ className = "text-2xl" }: { className?: string }) {
  return (
    <span className={`font-bold gradient-text ${className}`}>
      lincc
    </span>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center">
              <Logo className="text-3xl" />
            </a>
            <div className="flex items-center gap-4">
              <a
                href={`${APP_URL}/login`}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Log in
              </a>
              <a
                href={`${APP_URL}/signup`}
                className="px-4 py-2 rounded-full gradient-primary text-white font-medium hover:shadow-lg hover:shadow-purple/25 transition-all"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background gradient decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-coral/10 via-purple/10 to-blue/10 rounded-full blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-coral/10 to-purple/10 text-purple font-medium text-sm mb-6">
              <Sparkles className="h-4 w-4 text-coral" />
              The spontaneous way to meet people
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Real connections,
              <br />
              <span className="gradient-text">
                real moments
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Lincc helps you discover and join spontaneous activities happening around you.
              Coffee chats, gym sessions, hiking trips — find your people doing what you love.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={`${APP_URL}/signup`}
                className="w-full sm:w-auto px-8 py-4 rounded-full gradient-primary text-white font-semibold text-lg hover:shadow-xl hover:shadow-purple/30 transition-all flex items-center justify-center gap-2"
              >
                Start Meeting People
                <ChevronRight className="h-5 w-5" />
              </a>
              <a
                href={`${APP_URL}/demo`}
                className="w-full sm:w-auto px-8 py-4 rounded-full border-2 border-gray-200 text-gray-700 font-semibold text-lg hover:border-purple hover:text-purple transition-all"
              >
                See Demo
              </a>
            </div>
          </div>

          {/* App Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-gradient-to-br from-coral/5 via-purple/5 to-blue/10 rounded-3xl p-8 sm:p-12 border border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Sample Event Cards */}
                <EventCard
                  icon={<Coffee className="h-5 w-5 text-white" />}
                  category="Coffee"
                  title="Morning Coffee Chat"
                  venue="Blue Bottle Coffee"
                  time="Starting in 30 min"
                  spots={2}
                  host="Sarah"
                />
                <EventCard
                  icon={<Dumbbell className="h-5 w-5 text-white" />}
                  category="Fitness"
                  title="Evening Gym Session"
                  venue="Equinox Fitness"
                  time="Today at 6 PM"
                  spots={3}
                  host="Mike"
                  className="hidden sm:block"
                />
                <EventCard
                  icon={<Gamepad2 className="h-5 w-5 text-white" />}
                  category="Gaming"
                  title="Board Game Night"
                  venue="Game Parlour"
                  time="Tomorrow at 7 PM"
                  spots={5}
                  host="Alex"
                  className="hidden lg:block"
                />
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
              Three simple steps to start making real connections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              icon={<Calendar className="h-8 w-8 text-coral" />}
              title="Discover Events"
              description="Browse spontaneous activities happening near you, from coffee meetups to hiking adventures."
            />
            <StepCard
              number="2"
              icon={<Users className="h-8 w-8 text-purple" />}
              title="Join or Host"
              description="Request to join events that interest you, or create your own and invite others along."
            />
            <StepCard
              number="3"
              icon={<MessageCircle className="h-8 w-8 text-blue" />}
              title="Connect & Meet"
              description="Chat with participants, coordinate details, and show up to make real connections."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Built for Real Life
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Features designed to help you make genuine connections
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<MapPin className="h-6 w-6" />}
              title="Location-Based Discovery"
              description="Find activities happening within your preferred radius, from right next door to across the city."
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Smart Recommendations"
              description="Our algorithm learns your interests and suggests events you'll actually want to attend."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Safe Spaces"
              description="Women-only events available. Hosts can approve participants before they join."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Small Groups"
              description="Events are capped at small sizes to encourage meaningful conversations, not crowds."
            />
            <FeatureCard
              icon={<MessageCircle className="h-6 w-6" />}
              title="Group Chat"
              description="Coordinate with other participants before, during, and after the event."
            />
            <FeatureCard
              icon={<Calendar className="h-6 w-6" />}
              title="Spontaneous by Design"
              description="Events happen soon — usually within 24 hours. No planning, just doing."
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Every Interest, Every Vibe
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From chill hangouts to active adventures
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              'Coffee', 'Food & Drinks', 'Fitness', 'Sports', 'Hiking',
              'Gaming', 'Movies', 'Yoga', 'Art & Culture', 'Pets',
              'Study & Work', 'Language Exchange', 'Music', 'Photography'
            ].map((category) => (
              <span
                key={category}
                className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 font-medium hover:border-purple hover:text-purple transition-colors cursor-default"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-primary rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <Logo className="text-4xl mb-6 [&]:bg-white [&]:-webkit-background-clip-text [&]:bg-clip-text" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Stop scrolling. Start living.
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
                Join thousands of people who've made real friends through spontaneous meetups.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
                <Stat value="10k+" label="Active Users" />
                <div className="hidden sm:block w-px h-12 bg-white/20" />
                <Stat value="5k+" label="Events Created" />
                <div className="hidden sm:block w-px h-12 bg-white/20" />
                <Stat value="50k+" label="Connections Made" />
              </div>
              <a
                href={`${APP_URL}/signup`}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-purple font-semibold text-lg hover:shadow-xl transition-all"
              >
                Join Lincc Today
                <ChevronRight className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to make <span className="gradient-text">real connections</span>?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Sign up in 30 seconds and start discovering activities near you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`${APP_URL}/signup`}
              className="w-full sm:w-auto px-8 py-4 rounded-full gradient-primary text-white font-semibold text-lg hover:shadow-xl hover:shadow-purple/30 transition-all"
            >
              Get Started Free
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            No credit card required. Free forever.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <a href="/" className="flex items-center">
              <Logo className="text-3xl" />
            </a>
            <div className="flex items-center gap-6 text-gray-600">
              <a href="#" className="hover:text-purple transition-colors">About</a>
              <a href="#" className="hover:text-purple transition-colors">Privacy</a>
              <a href="#" className="hover:text-purple transition-colors">Terms</a>
              <a href="#" className="hover:text-purple transition-colors">Contact</a>
            </div>
            <p className="text-gray-500 text-sm">
              © 2026 Lincc. All rights reserved.
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
  spots,
  host,
  className = '',
}: {
  icon: React.ReactNode;
  category: string;
  title: string;
  venue: string;
  time: string;
  spots: number;
  host: string;
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
        <span className="text-gray-500">{spots} spots left</span>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-xs font-medium text-white">
          {host[0]}
        </div>
        <span className="text-sm text-gray-600">Hosted by {host}</span>
      </div>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 text-center relative">
      <div className="absolute top-4 left-4 w-8 h-8 rounded-full gradient-primary text-white font-bold flex items-center justify-center text-sm">
        {number}
      </div>
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-coral/10 to-purple/10 flex items-center justify-center mx-auto mb-4">
        {icon}
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-white/70 text-sm">{label}</p>
    </div>
  );
}
