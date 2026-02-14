import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import {
  type GoogleUser,
  waitForGIS,
  GOOGLE_CLIENT_ID,
  SCOPES,
} from '../services/googleAuth';
import { setTokenRefresher } from '../services/googleDrive';

interface AuthContextType {
  user: GoogleUser | null;
  loading: boolean;
  error: string | null;
  signIn: () => void;
  signOut: () => void;
  accessToken: string | null;
  requestToken: (prompt?: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'context-viewer-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const codeClientRef = useRef<google.accounts.oauth2.CodeClient | null>(null);
  // Promise-based deduplication for token refresh
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  // Resolve callback for the code flow popup
  const codeCallbackRef = useRef<((result: { token: string; user: GoogleUser } | null) => void) | null>(null);

  // Exchange auth code with server for tokens
  const exchangeCode = useCallback(async (code: string): Promise<{ access_token: string; user: GoogleUser } | null> => {
    try {
      const res = await fetch('/api/auth/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Exchange failed');
      }
      return await res.json();
    } catch (err) {
      console.error('Code exchange error:', err);
      return null;
    }
  }, []);

  // Refresh access token via server (reads HTTP-only cookie)
  const refreshAccessToken = useCallback((): Promise<string | null> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const promise = (async () => {
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return null;
        const data = await res.json();
        const token = data.access_token as string;
        setAccessToken(token);
        return token;
      } catch {
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = promise;
    return promise;
  }, []);

  // requestToken: '' → server refresh; 'consent' → code flow popup
  const requestToken = useCallback(async (prompt?: string): Promise<string | null> => {
    if (!prompt || prompt === '') {
      // Silent server-side refresh
      return refreshAccessToken();
    }

    // Consent / popup flow — trigger code client
    return new Promise((resolve) => {
      if (!codeClientRef.current) {
        resolve(null);
        return;
      }
      codeCallbackRef.current = (result) => {
        if (result) {
          resolve(result.token);
        } else {
          resolve(null);
        }
      };
      codeClientRef.current.requestCode();
    });
  }, [refreshAccessToken]);

  // Register the refresher with googleDrive.ts
  useEffect(() => {
    setTokenRefresher(refreshAccessToken);
  }, [refreshAccessToken]);

  // Initialize GIS code client on mount
  useEffect(() => {
    async function init() {
      // Restore identity from localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      if (!GOOGLE_CLIENT_ID) {
        setLoading(false);
        return;
      }

      try {
        await waitForGIS();

        // Initialize code client for auth code flow
        codeClientRef.current = google.accounts.oauth2.initCodeClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          ux_mode: 'popup',
          callback: async (response) => {
            if (response.error) {
              console.error('Code flow error:', response.error);
              setError(response.error_description || response.error);
              codeCallbackRef.current?.(null);
              return;
            }

            const result = await exchangeCode(response.code);
            if (!result) {
              setError('Sign-in failed');
              codeCallbackRef.current?.(null);
              return;
            }

            setUser(result.user);
            setAccessToken(result.access_token);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(result.user));
            setError(null);
            codeCallbackRef.current?.({ token: result.access_token, user: result.user });
          },
          error_callback: () => {
            codeCallbackRef.current?.(null);
          },
        });

        // If user is already stored, try silent server-side refresh (no popup)
        if (stored) {
          const token = await refreshAccessToken();
          if (token) {
            setAccessToken(token);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('GIS init error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setLoading(false);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(() => {
    setError(null);
    if (codeClientRef.current) {
      codeClientRef.current.requestCode();
    }
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(STORAGE_KEY);
    try {
      await fetch('/api/auth/revoke', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Best effort — cookie gets cleared server-side
    }
    google.accounts.id.disableAutoSelect();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signOut,
        accessToken,
        requestToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
