import { Header } from '../components/layout';
import { useReportProblem } from '../contexts/ReportProblemContext';
import { Mail, ArrowRight, AlertCircle, Instagram } from 'lucide-react';

const INSTAGRAM_URL = 'https://www.instagram.com/lincc_live';
const TIKTOK_URL = 'https://www.tiktok.com/@lincc_live';
const SUPPORT_EMAIL = 'hello@lincc.live';

// Lucide doesn't ship a TikTok glyph, so this is a small inline brand mark.
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M16.5 5.82a4.78 4.78 0 0 1-2.78-.92 4.78 4.78 0 0 1-1.86-3.4h-3v13.2a2.74 2.74 0 0 1-4.94 1.64 2.74 2.74 0 0 1 3.58-4.04V9.2a5.74 5.74 0 1 0 4.36 5.57V8.9a7.78 7.78 0 0 0 4.64 1.52v-3.0a4.78 4.78 0 0 1 0-1.6Z" />
    </svg>
  );
}

export default function ContactPage() {
  const { openReport } = useReportProblem();

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <Header title="Get in touch" />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Intro */}
        <section className="bg-surface rounded-2xl border border-border p-6 sm:p-8 text-center">
          <p className="text-purple font-semibold text-xs uppercase tracking-wider mb-3">Contact</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-text mb-3">
            We'd love to <span className="gradient-text">hear from you</span>
          </h1>
          <p className="text-sm sm:text-base text-text-muted leading-relaxed">
            Questions, feedback, partnerships, or a quick hi. Pick whichever's easiest.
          </p>
        </section>

        {/* Email */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3 px-1">
            Email
          </h2>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center gap-3 p-4 bg-surface rounded-2xl border border-border hover:border-purple/40 hover:bg-purple/5 transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center flex-shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text">{SUPPORT_EMAIL}</p>
              <p className="text-sm text-text-muted">General questions, feedback, and support</p>
            </div>
            <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-purple group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </a>
        </section>

        {/* Social */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3 px-1">
            Follow us
          </h2>
          <div className="bg-surface rounded-2xl border border-border divide-y divide-border">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 hover:bg-background transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-coral flex items-center justify-center flex-shrink-0">
                <Instagram className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text">Instagram</p>
                <p className="text-sm text-text-muted">@lincc_live</p>
              </div>
              <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-coral group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </a>
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 hover:bg-background transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral/10 to-purple/10 text-purple flex items-center justify-center flex-shrink-0">
                <TikTokIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text">TikTok</p>
                <p className="text-sm text-text-muted">@lincc_live</p>
              </div>
              <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-purple group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </a>
          </div>
        </section>

        {/* Report a problem: quick in-app loop */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide mb-3 px-1">
            Something broken?
          </h2>
          <button
            type="button"
            onClick={() => openReport({ source: 'contact' })}
            className="w-full flex items-center gap-3 p-4 bg-surface rounded-2xl border border-border hover:border-error/40 hover:bg-error/5 transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text">Report a problem</p>
              <p className="text-sm text-text-muted">Faster than email. We'll attach your device details automatically.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-text-muted group-hover:text-error group-hover:translate-x-0.5 transition-all flex-shrink-0" />
          </button>
        </section>

        <p className="text-center text-xs text-text-light pt-2">&copy; 2026 Lincc</p>
      </main>
    </div>
  );
}
