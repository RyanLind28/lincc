import { Link } from 'react-router-dom';

function Logo({ className = "text-2xl" }: { className?: string }) {
  return (
    <span className={`font-bold gradient-text ${className}`}>
      lincc
    </span>
  );
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-100/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <Logo className="text-3xl" />
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

      {/* Content */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">Legal</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-gray-500 mb-12">Last updated: February 2026</p>

          <div className="prose prose-lg text-gray-600 space-y-8">
            <p className="text-xl leading-relaxed">
              Your privacy matters to us. This policy explains what data we collect,
              how we use it, and your rights.
            </p>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide and improve Lincc's services</li>
                <li>To send you updates about our launch (you can opt out)</li>
                <li>To match you with relevant events and people</li>
                <li>To ensure safety and prevent abuse</li>
                <li>To respond to your questions and support requests</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Sharing</h2>
              <p>
                We do not sell your personal information. Ever. We may share data with
                service providers who help us operate Lincc (hosting, analytics, etc.),
                but only as necessary to provide our services and under strict
                confidentiality agreements.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Opt out of marketing communications</li>
                <li>Export your data</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <p>
                We use industry-standard security measures to protect your data,
                including encryption in transit and at rest. However, no method of
                transmission over the Internet is 100% secure.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p>
                Questions about this privacy policy? Email us at{' '}
                <a href="mailto:privacy@lincc.app" className="text-purple hover:underline">
                  privacy@lincc.app
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center">
            <Logo className="text-2xl" />
          </Link>
          <div className="flex items-center gap-6 text-gray-600 text-sm">
            <Link to="/about" className="hover:text-purple transition-colors">About</Link>
            <Link to="/privacy" className="hover:text-purple transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-purple transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-purple transition-colors">Contact</Link>
          </div>
          <p className="text-gray-500 text-sm">© 2026 Lincc</p>
        </div>
      </footer>
    </div>
  );
}
