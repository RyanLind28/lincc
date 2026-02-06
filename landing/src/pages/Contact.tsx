import { Link } from 'react-router-dom';
import { Mail, MapPin, ArrowRight } from 'lucide-react';

function Logo({ className = "text-2xl" }: { className?: string }) {
  return (
    <span className={`font-bold gradient-text ${className}`}>
      lincc
    </span>
  );
}

export default function Contact() {
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
          <p className="text-purple font-semibold text-sm uppercase tracking-wider mb-3">Contact</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Get in touch</h1>
          <p className="text-xl text-gray-600 mb-12">
            Have questions, feedback, or just want to say hi? We'd love to hear from you.
          </p>

          <div className="grid gap-6 md:grid-cols-2 mb-16">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Us</h2>
              <p className="text-gray-600 mb-4">
                For general inquiries and support
              </p>
              <a
                href="mailto:hello@lincc.app"
                className="text-purple font-semibold hover:underline"
              >
                hello@lincc.app
              </a>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Location</h2>
              <p className="text-gray-600 mb-4">
                We're based in
              </p>
              <p className="text-purple font-semibold">
                New York City
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-coral/5 via-purple/5 to-blue/5 rounded-2xl p-8 sm:p-12 border border-purple/10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
              Want to bring Lincc to your city?
            </h2>
            <p className="text-gray-600 mb-8 text-center max-w-lg mx-auto">
              We're launching in NYC first, but expanding based on demand.
              Join the waitlist and let us know where you're from.
            </p>
            <div className="text-center">
              <a
                href="/#waitlist"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full gradient-primary text-white font-semibold hover:shadow-xl hover:shadow-purple/30 transition-all group"
              >
                Join the Waitlist
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Follow Us</h2>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-purple hover:text-white transition-all"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a
                href="#"
                className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-purple hover:text-white transition-all"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"/></svg>
              </a>
              <a
                href="#"
                className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-purple hover:text-white transition-all"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd"/></svg>
              </a>
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
