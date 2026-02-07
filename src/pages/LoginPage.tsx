import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GOOGLE_CLIENT_ID, waitForGIS } from '../services/googleAuth';

export function LoginPage() {
  const { signIn, loading, error, user, accessToken } = useAuth();
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Redirect once user is authenticated with a token
  useEffect(() => {
    if (user && accessToken) {
      navigate('/', { replace: true });
    }
  }, [user, accessToken, navigate]);

  // Render GIS sign-in button
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) return;

    let cancelled = false;
    waitForGIS().then(() => {
      if (cancelled || !googleButtonRef.current) return;
      google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 320,
      });
    });

    return () => { cancelled = true; };
  }, []);

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
                <div ref={googleButtonRef} />
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
