import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-500 mb-12">Last updated: February 2026</p>

          <div className="prose prose-lg text-gray-600 space-y-8">
            <p className="text-xl leading-relaxed">
              Welcome to Lincc. By using our service, you agree to these terms.
              Please read them carefully.
            </p>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Using Lincc</h2>
              <p className="mb-4">To use Lincc, you must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Be at least 18 years old</li>
                <li>Provide accurate information about yourself</li>
                <li>Keep your account credentials secure</li>
                <li>Use Lincc for its intended purpose</li>
                <li>Treat other users with respect</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Prohibited Conduct</h2>
              <p className="mb-4">You may not:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Harass, threaten, or abuse other users</li>
                <li>Create fake profiles or impersonate others</li>
                <li>Use Lincc for commercial purposes without permission</li>
                <li>Post illegal, harmful, or offensive content</li>
                <li>Attempt to access other users' accounts</li>
                <li>Use bots or automated tools</li>
                <li>Violate any applicable laws</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Safety</h2>
              <p>
                While we work hard to create a safe environment, you are responsible for
                your own safety when attending events. We recommend meeting in public places
                and telling a friend your plans.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Content</h2>
              <p>
                You retain ownership of content you post on Lincc. By posting, you grant us
                a license to display and distribute that content on our platform.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination</h2>
              <p>
                We may suspend or terminate your account if you violate these terms.
                You can also delete your account at any time from your settings.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to Terms</h2>
              <p>
                We may update these terms from time to time. We'll notify you of significant
                changes. Continued use of Lincc after changes constitutes acceptance.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact</h2>
              <p>
                Questions about these terms? Email us at{' '}
                <a href="mailto:legal@lincc.app" className="text-purple hover:underline">
                  legal@lincc.app
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
