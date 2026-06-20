import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface">
      <LandingNav />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-text mb-4">Privacy Policy</h1>
          <p className="text-text-light mb-12">Last updated: February 2026</p>

          <div className="prose prose-lg text-text-muted space-y-8">
            <p className="text-xl leading-relaxed">
              Your privacy matters to us. This policy explains what data we collect,
              how we use it, and your rights.
            </p>

            <div>
              <h2 className="text-2xl font-semibold text-text mb-4">Information We Collect</h2>
              <p className="mb-4">We collect information you provide directly:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name and email when you join our waitlist</li>
                <li>Profile information when you create an account</li>
                <li>Location data to show nearby events (with permission)</li>
                <li>Messages and content you share on the platform</li>
                <li>Usage data to improve our service</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-text mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide and improve Lincc's services</li>
                <li>To send you updates about our launch (you can opt out)</li>
                <li>To match you with relevant events near you</li>
                <li>To ensure safety and prevent abuse</li>
                <li>To respond to your questions and support requests</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-text mb-4">Data Sharing</h2>
              <p>
                We do not sell your personal information. Ever. We may share data with
                service providers who help us operate Lincc (hosting, analytics, etc.),
                but only as necessary to provide our services and under strict
                confidentiality agreements.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-text mb-4">Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Opt out of marketing communications</li>
                <li>Export your data</li>
              </ul>
            </div>

            <div id="delete-data">
              <h2 className="text-2xl font-semibold text-text mb-4">Delete Your Data</h2>
              <p className="mb-4">
                You can delete your Lincc account and all associated data at any time. This is permanent and cannot be undone.
              </p>
              <ol className="list-decimal pl-6 space-y-2 mb-4">
                <li>Log in to your Lincc account</li>
                <li>Go to Settings</li>
                <li>Scroll to the bottom and tap "Delete Account"</li>
                <li>Type DELETE to confirm</li>
              </ol>
              <p>
                This will permanently remove your profile, events, messages, and all other data from Lincc. If you need help, email us at{' '}
                <a href="mailto:hello@lincc.live" className="text-purple hover:underline">
                  hello@lincc.live
                </a>
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-text mb-4">Data Security</h2>
              <p>
                We use industry-standard security measures to protect your data,
                including encryption in transit and at rest. However, no method of
                transmission over the Internet is 100% secure.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-text mb-4">Contact Us</h2>
              <p>
                Questions about this privacy policy? Email us at{' '}
                <a href="mailto:hello@lincc.live" className="text-purple hover:underline">
                  hello@lincc.live
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[var(--z-header)] bg-surface/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/landing" className="flex items-center">
            <img src="https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp" alt="Lincc" className="h-10" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="px-4 py-2.5 rounded-full text-text font-semibold text-sm hover:text-purple transition-colors">Log in</Link>
            <Link to="/signup" className="px-5 py-2.5 rounded-full gradient-primary text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple/25 hover:-translate-y-0.5 transition-all">Sign up</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function LandingFooter() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/landing" className="flex items-center">
            <img src="https://qmctlt61dm3jfh0i.public.blob.vercel-storage.com/brand/logo/Lincc_Main_Horizontal%404x.webp" alt="Lincc" className="h-10" />
          </Link>
          <div className="flex items-center gap-6 text-text-muted">
            <Link to="/landing/about" className="hover:text-purple transition-colors">About</Link>
            <Link to="/landing/privacy" className="hover:text-purple transition-colors">Privacy</Link>
            <Link to="/landing/terms" className="hover:text-purple transition-colors">Terms</Link>
            <Link to="/landing/contact" className="hover:text-purple transition-colors">Contact</Link>
          </div>
          <p className="text-text-light text-sm">&copy; 2026 Lincc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
