import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GOOGLE_CLIENT_ID } from '../services/googleAuth';

export function LoginPage() {
  const { signIn, loading, error, user, handleOAuthCallback } = useAuth();
  const [localError, setLocalError] = useState<string | null>(null);
  const [processingCallback, setProcessingCallback] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkCallback() {
      if (window.location.hash.includes('access_token')) {
        setProcessingCallback(true);
        const success = await handleOAuthCallback();
        setProcessingCallback(false);
        if (success) {
          navigate('/', { replace: true });
        }
      }
    }
    checkCallback();
  }, [handleOAuthCallback, navigate]);

  useEffect(() => {
    if (user && !processingCallback) {
      navigate('/', { replace: true });
    }
  }, [user, navigate, processingCallback]);

  const handleSignIn = async () => {
    try {
      setLocalError(null);
      await signIn();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  const isConfigured = Boolean(GOOGLE_CLIENT_ID);
  const isProcessing = loading || processingCallback;

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
            <button
              onClick={handleSignIn}
              disabled={isProcessing}
              className="w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl py-4 px-5 flex items-center justify-center gap-3 font-medium text-[var(--color-text)] hover:border-[var(--color-text-tertiary)] hover:shadow-md transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <span className="text-[var(--color-text-secondary)]">Signing in...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>

            {(error || localError) && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">{error || localError}</p>
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
