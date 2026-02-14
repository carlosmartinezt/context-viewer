import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1
          className="text-3xl font-semibold text-[var(--color-text)] tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Context Viewer
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-2 text-lg">
          Browse your markdown files
        </p>
      </div>

      <div className="w-full max-w-sm">
        {!isConfigured ? (
          <div className="card border-l-4 border-l-amber-400">
            <h3 className="font-medium text-[var(--color-text)] mb-2">Setup Required</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Google OAuth is not configured. Add your Client ID to{' '}
              <code className="bg-[var(--color-bg-subtle)] px-1 rounded text-sm">
                .env.local
              </code>
            </p>
            <pre className="mt-3 text-xs bg-[var(--color-bg-subtle)] p-3 rounded-lg overflow-x-auto text-[var(--color-text-secondary)]">
              VITE_GOOGLE_CLIENT_ID=your-client-id
            </pre>
          </div>
        ) : (
          <>
            {loading ? (
              <div className="flex justify-center">
                <span className="text-[var(--color-text-secondary)]">Signing in...</span>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={signIn}
                  className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 transition-all text-gray-700 font-medium text-base"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <p className="text-sm text-[var(--color-text-tertiary)] text-center mt-6">
              Sign in to access your Drive files
            </p>
          </>
        )}
      </div>
    </div>
  );
}
