import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GOOGLE_CLIENT_ID } from '../services/googleAuth';

export function LoginPage() {
  const { loading, error, user, accessToken, signIn } = useAuth();
  const navigate = useNavigate();

  // Redirect once user is authenticated with a token
  useEffect(() => {
    if (user && accessToken) {
      navigate('/', { replace: true });
    }
  }, [user, accessToken, navigate]);

  const isConfigured = Boolean(GOOGLE_CLIENT_ID);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col p-6">
      {/* Hero / About section */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto text-center">
        <img src="/logo.svg" alt="Context Viewer logo" className="w-24 h-24 mb-8" />
        <h1
          className="text-4xl font-semibold text-[var(--color-text)] tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Context Viewer
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-4 text-lg leading-relaxed">
          Context Viewer is a read-only Google Drive browser for viewing and navigating
          your markdown files. Browse folder structures and render markdown documents
          directly from your Drive.
        </p>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
          <div className="p-4 rounded-xl bg-[var(--color-bg-subtle)]">
            <div className="text-2xl mb-2">📁</div>
            <h3 className="font-medium text-[var(--color-text)] text-sm">Folder Navigation</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Browse your Google Drive folder structure with dynamic navigation.</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--color-bg-subtle)]">
            <div className="text-2xl mb-2">📄</div>
            <h3 className="font-medium text-[var(--color-text)] text-sm">Markdown Rendering</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">View markdown files with full support for tables, code blocks, and links.</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--color-bg-subtle)]">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-medium text-[var(--color-text)] text-sm">Read-Only Access</h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Your files are never modified, copied, or stored. Fully read-only.</p>
          </div>
        </div>

        {/* Sign in section */}
        {isConfigured && (
          <div className="mt-10">
            {!isConfigured ? null : loading ? (
              <span className="text-[var(--color-text-secondary)]">Signing in...</span>
            ) : (
              <>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Get started by connecting your Google account.
                </p>
                <button
                  onClick={signIn}
                  className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 transition-all text-gray-700 font-medium text-base mx-auto"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Get started with Google
                </button>
              </>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="py-6 text-center text-xs text-[var(--color-text-tertiary)] space-x-3">
        <Link to="/privacy" className="hover:text-[var(--color-text-secondary)] underline">Privacy Policy</Link>
        <span>&middot;</span>
        <Link to="/terms" className="hover:text-[var(--color-text-secondary)] underline">Terms of Service</Link>
      </footer>
    </div>
  );
}
