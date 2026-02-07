import { Link } from 'react-router-dom';
import {
  Users,
  MapPin,
  MessageCircle,
  Shield,
  Sparkles,
  Coffee,
  Dumbbell,
  Gamepad2,
  Heart,
  Zap,
  Globe,
  ArrowRight,
  Check,
} from 'lucide-react';
import WaitlistForm from '../components/WaitlistForm';

function Logo({ className = "text-2xl", white = false }: { className?: string; white?: boolean }) {
  return (
    <span className={`font-bold ${white ? 'text-white' : 'gradient-text'} ${className}`}>
      lincc
    </span>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <Logo className="text-3xl" />
            </Link>
            <div className="hidden sm:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#how-it-works" className="hover:text-purple transition-colors">How it works</a>
              <a href="#features" className="hover:text-purple transition-colors">Features</a>
              <Link to="/about" className="hover:text-purple transition-colors">About</Link>
            </div>
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
              Meet people who
              <br />
              <span className="gradient-text">actually show up</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Lincc connects you with real people for spontaneous activities —
              coffee chats, gym sessions, hikes, and more. No endless swiping.
              Just real moments with real people.
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
              Be first to know when we launch. No spam, ever.
            </p>
          </div>

          {/* App Preview */}
          <div className="mt-16 sm:mt-20 relative">
            {/* Glow effect behind cards */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple/5 to-transparent rounded-3xl" />

            <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-6 sm:p-10 border border-gray-200/60 shadow-2xl shadow-gray-200/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <EventCard
                  icon={<Coffee className="h-5 w-5 text-white" />}
                  category="Coffee"
                  title="Morning Coffee Chat"
                  venue="Local Coffee Shop"
                  time="Starting in 30 min"
                  spots={2}
                  host="Sarah"
                  hostImage="S"
                  gradient="from-amber-500 to-orange-500"
                />
                <EventCard
                  icon={<Dumbbell className="h-5 w-5 text-white" />}
                  category="Fitness"
                  title="Evening Gym Session"
                  venue="Downtown Gym"
                  time="Today at 6 PM"
                  spots={3}
                  host="Mike"
                  hostImage="M"
                  gradient="from-purple to-blue"
                  className="hidden sm:block"
                />
                <EventCard
                  icon={<Gamepad2 className="h-5 w-5 text-white" />}
                  category="Gaming"
                  title="Board Game Night"
                  venue="The Game Cafe"
                  time="Tomorrow at 7 PM"
                  spots={5}
                  host="Alex"
                  hostImage="A"
                  gradient="from-coral to-purple"
                  className="hidden lg:block"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-bold gradient-text">15+</p>
              <p className="text-gray-600 text-sm mt-1">Activity categories</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-gray-200" />
            <div>
              <p className="text-3xl sm:text-4xl font-bold gradient-text">24hrs</p>
              <p className="text-gray-600 text-sm mt-1">Spontaneous events</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-gray-200" />
            <div>
              <p className="text-3xl sm:text-4xl font-bold gradient-text">2-8</p>
              <p className="text-gray-600 text-sm mt-1">People per group</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              From stranger to friend
              <br />
              <span className="gradient-text">in three steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <StepCard
              number="01"
              icon={<MapPin className="h-7 w-7" />}
              title="Discover"
              description="Browse activities happening near you right now. Coffee, fitness, hikes, games — find what excites you."
            />
            <StepCard
              number="02"
              icon={<Users className="h-7 w-7" />}
              title="Join"
              description="Request to join with one tap. Hosts review requests to keep groups small and compatible."
            />
            <StepCard
              number="03"
              icon={<Heart className="h-7 w-7" />}
              title="Connect"
              description="Show up, have fun, make friends. Real connections happen when you share real experiences."
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
              Built different.
              <br />
              <span className="gradient-text">Built for real life.</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-4">
              Everything you need to find your people and make genuine connections.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Spontaneous"
              description="Events happen within 24 hours. No more 'let's hang out sometime' that never happens."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Safe & Vetted"
              description="Hosts approve participants. Women-only events available. Real profiles, real people."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Small Groups"
              description="Capped at 2-8 people. Intimate enough for real conversation, not lost in a crowd."
            />
            <FeatureCard
              icon={<MapPin className="h-6 w-6" />}
              title="Hyperlocal"
              description="Find activities within walking distance or across the city. You set the radius."
            />
            <FeatureCard
              icon={<MessageCircle className="h-6 w-6" />}
              title="Group Chat"
              description="Coordinate details, share updates, and keep the conversation going after."
            />
            <FeatureCard
              icon={<Sparkles className="h-6 w-6" />}
              title="Smart Matching"
              description="Our algorithm learns your interests and suggests events you'll actually love."
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">Categories</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Whatever you're into
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: 'Coffee & Tea', icon: '☕' },
              { name: 'Food & Drinks', icon: '🍜' },
              { name: 'Fitness', icon: '💪' },
              { name: 'Running', icon: '🏃' },
              { name: 'Hiking', icon: '🥾' },
              { name: 'Yoga', icon: '🧘' },
              { name: 'Gaming', icon: '🎮' },
              { name: 'Board Games', icon: '🎲' },
              { name: 'Movies', icon: '🎬' },
              { name: 'Art & Museums', icon: '🎨' },
              { name: 'Music', icon: '🎵' },
              { name: 'Photography', icon: '📸' },
              { name: 'Dog Walking', icon: '🐕' },
              { name: 'Study & Work', icon: '💻' },
              { name: 'Language Exchange', icon: '🗣️' },
              { name: 'Book Club', icon: '📚' },
            ].map((category) => (
              <span
                key={category.name}
                className="px-4 py-2.5 rounded-full bg-white border border-gray-200 text-gray-700 font-medium hover:border-purple hover:text-purple hover:bg-purple/5 transition-all cursor-default flex items-center gap-2"
              >
                <span>{category.icon}</span>
                {category.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Why Lincc */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">Why Lincc?</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Because scrolling
                <br />
                <span className="gradient-text">isn't living</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We spend hours online but feel more disconnected than ever. Lincc is different.
                We help you put down the phone and show up — to a coffee shop, a trail, a gym,
                wherever life happens.
              </p>
              <div className="space-y-4">
                {[
                  'No endless swiping or messaging',
                  'Meet in person within 24 hours',
                  'Small groups for real conversation',
                  'Built-in safety features',
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
                  We're building something special and launching soon.
                  Join the waitlist to get early access.
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
              <Logo className="text-5xl mb-6" white />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                Stop scrolling.
                <br />
                Start living.
              </h2>
              <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-xl mx-auto">
                Real connections are waiting. Be the first to experience Lincc when we launch.
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
            We're launching soon. Get early access and be among the first to make real connections.
          </p>
          <WaitlistForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Logo className="text-3xl mb-4" />
              <p className="text-gray-500 text-sm">
                Real connections,
                <br />
                real moments.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-3 text-gray-600">
                <li><a href="#how-it-works" className="hover:text-purple transition-colors">How it works</a></li>
                <li><a href="#features" className="hover:text-purple transition-colors">Features</a></li>
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
              © 2026 Lincc. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-purple transition-colors">
                <span className="sr-only">Twitter</span>
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
  spots,
  host,
  hostImage,
  gradient = "from-coral to-purple",
  className = '',
}: {
  icon: React.ReactNode;
  category: string;
  title: string;
  venue: string;
  time: string;
  spots: number;
  host: string;
  hostImage: string;
  gradient?: string;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg border border-gray-100 transition-all hover:-translate-y-1 ${className}`}>
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
      <div className="flex items-center justify-between text-sm mb-4">
        <span className="text-purple font-medium">{time}</span>
        <span className="text-gray-400">{spots} spots left</span>
      </div>
      <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-semibold text-white`}>
          {hostImage}
        </div>
        <span className="text-sm text-gray-600">Hosted by <span className="font-medium text-gray-900">{host}</span></span>
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
    <div className="text-center">
      <div className="relative inline-flex mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-coral/10 to-purple/10 flex items-center justify-center text-purple">
          {icon}
        </div>
        <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full gradient-primary text-white text-sm font-bold flex items-center justify-center">
          {number}
        </span>
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
