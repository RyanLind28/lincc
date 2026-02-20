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
import './Home.css';

const LOGO_URL = 'https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp';

const EVENT_CARDS = [
  { icon: Wine, category: 'Flash Sale', title: 'Half-price cocktails', venue: 'Skybar', time: 'Next 2 hours only', detail: '50% off', bg: 'linear-gradient(135deg, #FF6B6B, #845EF7)' },
  { icon: PartyPopper, category: 'Social', title: 'Board games night at mine', venue: 'Hackney', time: '7pm tonight', detail: '3 spots left', bg: 'linear-gradient(135deg, #845EF7, #5C7CFA)' },
  { icon: Coffee, category: 'Meetup', title: 'Morning run & coffee', venue: 'Victoria Park', time: 'Tomorrow 7am', detail: 'All levels welcome', bg: 'linear-gradient(135deg, #f59e0b, #f97316)' },
];

const CATEGORIES: { name: string; Icon: LucideIcon }[] = [
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
];

export default function Home() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <Link to="/"><img src={LOGO_URL} alt="Lincc — local events and discovery platform" style={{ height: 40, width: 120 }} /></Link>
          <div className="nav-links">
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
            <a href="#businesses">For Businesses</a>
            <Link to="/about">About</Link>
          </div>
          <a href="#waitlist" className="nav-cta">Get Early Access</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="landing-container">
          <div className="hero-badge">
            <Sparkles style={{ width: 16, height: 16, color: '#FF6B6B' }} />
            Coming Soon — Join the waitlist
          </div>

          <h1>
            No Algorithms.<br />
            <span className="gradient-text">Just what's happening now</span>
          </h1>

          <h2 style={{ fontSize: '18px', fontWeight: 500, color: '#845EF7', marginBottom: '16px', letterSpacing: '0.01em' }}>
            Discover local events, deals, and things to do near you
          </h2>

          <p className="hero-sub">
            Tired of Instagram showing you last week's posts when you want to know what's on tonight? Lincc is different. Everything you see is happening now or soon, in the order it was posted. No algorithms choosing for you.
          </p>

          <a href="#waitlist" className="hero-cta">
            Get Early Access
            <ArrowRight style={{ width: 20, height: 20 }} />
          </a>
          <p className="hero-note">Be first to know when we launch.</p>

          {/* Preview Cards */}
          <div className="preview-section">
            {/* Desktop: grid */}
            <div className="preview-grid">
              {EVENT_CARDS.map((card) => (
                <EventCard key={card.title} {...card} />
              ))}
            </div>

            {/* Mobile: horizontal scroll */}
            <div className="preview-scroll">
              {EVENT_CARDS.map((card) => (
                <div key={card.title} className="preview-scroll-item">
                  <EventCard {...card} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Lincc */}
      <section className="why-section">
        <div className="landing-container">
          <p className="section-label">Why Lincc</p>
          <h2>Real-Time. Chronological. Unfiltered.</h2>
          <p className="tagline gradient-text">Your social life, sorted.</p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="how-section">
        <div className="landing-container">
          <div className="section-header">
            <p className="section-label">How it works</p>
            <h2>Your area, at your<br /><span className="gradient-text">fingertips</span></h2>
          </div>
          <div className="steps-grid">
            <StepCard number="1" title="See what's on" description="Open Lincc and instantly see everything happening around you — events, deals, openings, meetups, and more." />
            <StepCard number="2" title="Find your vibe" description="Narrow it down to what suits you — by time, place, or interest. From tonight's plans to this weekend's events." />
            <StepCard number="3" title="Get out there" description="Grab a deal, join an event, or try something new. Everything you need to go is right here." />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features-section">
        <div className="landing-container">
          <div className="section-header">
            <p className="section-label">Features</p>
            <h2>Everything you need,<br /><span className="gradient-text">one place.</span></h2>
            <p>Events, deals, meetups, and local happenings — all in your pocket.</p>
          </div>
          <div className="features-grid">
            <FeatureCard icon={<Heart style={{ width: 24, height: 24 }} />} title="New connections" description="Find a coffee buddy, a running partner, a co-working crew, or a whole new circle. Meet people doing what you love." />
            <FeatureCard icon={<Sparkles style={{ width: 24, height: 24 }} />} title="New things to do" description="Pop-up markets, open mic nights, food festivals, club openings — discover things you never knew were happening." />
            <FeatureCard icon={<Tag style={{ width: 24, height: 24 }} />} title="Exclusive deals" description="Offers and discounts from local restaurants, bars, and shops — only on Lincc." />
            <FeatureCard icon={<Clock style={{ width: 24, height: 24 }} />} title="Always something on" description="Live, real-time events updated around the clock. Whether it's tonight or this weekend, there's always a plan." />
            <FeatureCard icon={<MapPin style={{ width: 24, height: 24 }} />} title="Right on your doorstep" description="See what's within walking distance or explore further out. Your area is more interesting than you think." />
            <FeatureCard icon={<Store style={{ width: 24, height: 24 }} />} title="Support local" description="Discover independent restaurants, shops, and venues in your neighbourhood. Keep it local." />
          </div>
        </div>
      </section>

      {/* For Businesses */}
      <section id="businesses" className="biz-section">
        <div className="landing-container">
          <div className="biz-grid">
            <div>
              <p className="section-label">For Businesses</p>
              <h2>Reach customers<br /><span className="gradient-text">when it matters</span></h2>
              <p className="biz-desc">
                Whether you're a restaurant, bar, shop, or venue — Lincc puts your events, offers, and promotions in front of people who are nearby and ready to go.
              </p>
              <div className="biz-checklist">
                {['Post events, offers & promotions instantly', 'Reach people within walking distance', 'Drive foot traffic with time-limited deals', 'Track engagement and redemptions'].map((item) => (
                  <div key={item} className="biz-check-item">
                    <div className="biz-check-icon"><Check style={{ width: 14, height: 14, color: '#fff' }} /></div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="biz-cards-wrapper">
              <div className="biz-cards-glow" />
              <div className="biz-cards">
                <BusinessCard icon={<Utensils style={{ width: 20, height: 20, color: '#fff' }} />} name="The Garden Kitchen" type="Restaurant" offer="50% off lunch menu — Today only" bg="linear-gradient(135deg, #f59e0b, #f97316)" />
                <BusinessCard icon={<Coffee style={{ width: 20, height: 20, color: '#fff' }} />} name="Brew & Co" type="Coffee Shop" offer="Free pastry with any coffee before 10am" bg="linear-gradient(135deg, #FF6B6B, #845EF7)" />
                <BusinessCard icon={<Store style={{ width: 20, height: 20, color: '#fff' }} />} name="Urban Threads" type="Boutique" offer="New collection launch — 20% off this weekend" bg="linear-gradient(135deg, #845EF7, #5C7CFA)" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section">
        <div className="landing-container">
          <div className="section-header">
            <p className="section-label">Categories</p>
            <h2>Whatever you're looking for</h2>
          </div>
          <div className="category-tags">
            {CATEGORIES.map((cat) => (
              <span key={cat.name} className="category-tag">
                <cat.Icon style={{ width: 16, height: 16 }} />
                {cat.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="problem-section">
        <div className="landing-container">
          <div className="problem-grid">
            <div>
              <p className="section-label">The Problem</p>
              <h2>Stop searching.<br /><span className="gradient-text">Start discovering.</span></h2>
              <p className="biz-desc">
                How do you find out what's happening tonight? You check Instagram, Google, maybe five different apps — and still miss half of it. Lincc brings it all together. One place. Always up to date. Always local.
              </p>
              <div className="biz-checklist">
                {['Posted in order, not by engagement', "See what's on now, not last week", 'Local first — your area, your feed', 'No algorithm deciding what you see'].map((item) => (
                  <div key={item} className="biz-check-item">
                    <div className="biz-check-icon"><Check style={{ width: 14, height: 14, color: '#fff' }} /></div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="problem-card">
              <div className="biz-cards-glow" />
              <div className="problem-card-inner">
                <div className="problem-card-header">
                  <div className="problem-card-icon"><Globe style={{ width: 28, height: 28, color: '#fff' }} /></div>
                  <div>
                    <div className="problem-card-title">Launching Soon</div>
                    <div className="problem-card-subtitle">Be the first to know</div>
                  </div>
                </div>
                <p>We're building the go-to app for discovering everything happening in your area. Join the waitlist to get early access.</p>
                <a href="#waitlist">Join the waitlist <ArrowRight style={{ width: 16, height: 16 }} /></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-section">
        <div className="landing-container">
          <div className="cta-banner">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <img src={LOGO_URL} alt="Lincc" style={{ height: 56, width: 168, marginBottom: 24, filter: 'brightness(0) invert(1)' }} />
              <h2>Your city. Your scene.<br />All in one place.</h2>
              <p>Events, offers, openings, happenings — everything that matters, right at your fingertips.</p>
              <a href="#waitlist" className="cta-banner-btn">
                Get Early Access
                <ArrowRight style={{ width: 20, height: 20 }} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="waitlist-section">
        <div className="landing-container">
          <p className="section-label">Join the waitlist</p>
          <h2>Be first in line</h2>
          <p>We're launching soon. Get early access and never miss what's happening around you again.</p>
          <WaitlistForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <img src={LOGO_URL} alt="Lincc" style={{ height: 40, width: 120 }} />
              <p>Everything local,<br />at your fingertips.</p>
            </div>
            <div className="footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="#how-it-works">How it works</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#businesses">For Businesses</a></li>
                <li><a href="#waitlist">Join waitlist</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <ul>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <ul>
                <li><Link to="/privacy">Privacy</Link></li>
                <li><Link to="/terms">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Lincc. All rights reserved.</p>
            <div className="footer-socials">
              <a href="#"><svg style={{ width: 20, height: 20 }} fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
              <a href="#"><svg style={{ width: 20, height: 20 }} fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"/></svg></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub-components ─── */

function EventCard({ icon: Icon, category, title, venue, time, detail, bg }: {
  icon: LucideIcon;
  category: string;
  title: string;
  venue: string;
  time: string;
  detail: string;
  bg: string;
}) {
  return (
    <div className="event-card">
      <div className="event-card-header">
        <div className="event-card-icon" style={{ background: bg }}>
          <Icon style={{ width: 20, height: 20, color: '#fff' }} />
        </div>
        <span className="event-card-category">{category}</span>
      </div>
      <h3>{title}</h3>
      <p className="event-card-venue">{venue}</p>
      <div className="event-card-footer">
        <span className="event-card-time">{time}</span>
        <span className="event-card-detail">{detail}</span>
      </div>
    </div>
  );
}

function BusinessCard({ icon, name, type, offer, bg }: {
  icon: React.ReactNode;
  name: string;
  type: string;
  offer: string;
  bg: string;
}) {
  return (
    <div className="biz-card">
      <div className="biz-card-icon" style={{ background: bg }}>{icon}</div>
      <div className="biz-card-info">
        <div className="biz-card-top">
          <span className="biz-card-name">{name}</span>
          <span className="biz-card-type">{type}</span>
        </div>
        <p className="biz-card-offer">{offer}</p>
      </div>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="step-card">
      <div className="step-number">{number}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
