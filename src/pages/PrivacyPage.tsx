export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-6 max-w-2xl mx-auto">
      <h1
        className="text-3xl font-semibold text-[var(--color-text)] mb-6"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Privacy Policy
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-8">
        Last updated: February 15, 2026
      </p>

      <div className="space-y-6 text-[var(--color-text-secondary)] text-[15px] leading-relaxed">
        <section>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Overview</h2>
          <p>
            Context Viewer is a personal, read-only Google Drive file browser that renders
            markdown files. It is not a commercial product and is intended for private use
            by a small number of authorized users.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Data We Access</h2>
          <p>When you sign in with Google, we request access to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Your Google profile</strong> (name, email, profile picture) — to identify your account</li>
            <li><strong>Google Drive (read-only)</strong> — to list folders and display markdown files you select</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Your Google profile is stored locally in your browser to keep you signed in</li>
            <li>Your Google Drive files are fetched on-demand and displayed in the browser — they are never stored, copied, or transmitted to any third party</li>
            <li>A refresh token is stored as an HTTP-only cookie on your device to maintain your session</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Data Storage</h2>
          <p>
            Context Viewer does not have a database. All user data is stored locally in your
            browser (localStorage and cookies). No personal data is stored on any server.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Third-Party Services</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Google Identity Services</strong> — for authentication</li>
            <li><strong>Google Drive API</strong> — for reading your files</li>
            <li><strong>Vercel</strong> — for hosting the application</li>
          </ul>
          <p className="mt-2">No analytics, tracking, or advertising services are used.</p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Data Deletion</h2>
          <p>
            You can revoke access at any time by signing out of the app or removing Context Viewer
            from your{' '}
            <a
              href="https://myaccount.google.com/connections"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-accent)] underline"
            >
              Google Account connections
            </a>
            . This removes all stored tokens and data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-[var(--color-text)] mb-2">Contact</h2>
          <p>
            For questions about this privacy policy, contact{' '}
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
