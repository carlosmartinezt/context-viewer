import { Link } from 'react-router-dom';

export function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col p-6">
      <div className="flex-1 max-w-2xl mx-auto w-full py-12">
        <div className="text-center mb-12">
          <img src="/logo.svg" alt="Context Viewer logo" className="w-24 h-24 mx-auto mb-6" />
          <h1
            className="text-4xl font-semibold text-[var(--color-text)] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Context Viewer
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-4 text-lg leading-relaxed max-w-md mx-auto">
            A read-only Google Drive browser for viewing and navigating your markdown files.
          </p>
        </div>

        <div className="space-y-8 text-[var(--color-text-secondary)] text-[15px] leading-relaxed">
          <section>
            <h2 className="text-lg font-medium text-[var(--color-text)] mb-3">What Context Viewer Does</h2>
            <p>
              Context Viewer connects to your Google Drive and lets you browse folder structures
              and view markdown files rendered in your browser. It provides a clean, mobile-friendly
              reading experience for your Drive documents.
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Browse and navigate your Google Drive folder hierarchy</li>
              <li>Render markdown files with full support for tables, code blocks, links, and images</li>
              <li>Mobile-first design with dynamic bottom navigation</li>
              <li>Select any Drive folder as your root browsing folder</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--color-text)] mb-3">How Context Viewer Uses Your Google Data</h2>
            <p>
              Context Viewer requests access to your Google account for the following purposes:
            </p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>
                <strong>Google profile (name, email, profile picture)</strong> — used to identify
                your account and display your profile within the app. Your profile information is
                stored locally in your browser only.
              </li>
              <li>
                <strong>Google Drive (read-only access)</strong> — used to list your folders and
                read your markdown files for display in the browser. Context Viewer never modifies,
                deletes, or creates any files in your Google Drive. Your file contents are fetched
                on-demand and are never stored, copied, or sent to any third party.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--color-text)] mb-3">Data Storage & Security</h2>
            <p>
              Context Viewer does not have a database or server-side storage. All user data is
              stored locally in your browser. Authentication tokens are managed securely via
              HTTP-only cookies and are never exposed to client-side code. No analytics, tracking,
              or advertising services are used.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-[var(--color-text)] mb-3">Revoking Access</h2>
            <p>
              You can revoke Context Viewer's access to your Google account at any time by
              visiting your{' '}
              <a
                href="https://myaccount.google.com/connections"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] underline"
              >
                Google Account third-party connections
              </a>{' '}
              and removing Context Viewer.
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Go to Context Viewer
          </Link>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-[var(--color-text-tertiary)] space-x-3">
        <Link to="/privacy" className="hover:text-[var(--color-text-secondary)] underline">Privacy Policy</Link>
        <span>&middot;</span>
        <Link to="/terms" className="hover:text-[var(--color-text-secondary)] underline">Terms of Service</Link>
      </footer>
    </div>
  );
}
