export function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-6 max-w-2xl mx-auto">
      <h1
        className="text-3xl font-semibold text-[var(--color-text)] mb-6"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Terms of Service
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-8">
        Last updated: February 15, 2026
      </p>

      <div className="space-y-6 text-[var(--color-text-secondary)] text-[15px] leading-relaxed">
        <section>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Acceptance of Terms</h2>
          <p>
            By using Context Viewer, you agree to these terms. If you do not agree, do not use the app.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Description of Service</h2>
          <p>
            Context Viewer is a personal, read-only web application that connects to your Google Drive
            to browse and render markdown files. The app does not modify, delete, or create any files
            in your Google Drive.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Access</h2>
          <p>
            Access is limited to authorized users. The app operator reserves the right to grant or
            revoke access at any time without notice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Your Google Account</h2>
          <p>
            You are responsible for maintaining the security of your Google account. Context Viewer
            accesses your Drive files using permissions you grant via Google's OAuth consent flow.
            You may revoke these permissions at any time through your{' '}
            <a
              href="https://myaccount.google.com/connections"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] underline"
            >
              Google Account settings
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Disclaimer</h2>
          <p>
            Context Viewer is provided "as is" without warranties of any kind, either express or
            implied. The app is a personal project and is not guaranteed to be available, error-free,
            or secure at all times.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Limitation of Liability</h2>
          <p>
            The app operator shall not be liable for any damages arising from the use of this
            application, including but not limited to data loss, service interruption, or
            unauthorized access to your Google account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Changes to Terms</h2>
          <p>
            These terms may be updated at any time. Continued use of the app constitutes acceptance
            of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Contact</h2>
          <p>
            For questions about these terms, contact{' '}
            <a href="mailto:carlosmartinezt@gmail.com" className="text-[var(--color-accent)] underline">
              carlosmartinezt@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
