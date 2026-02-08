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
  decodeIdToken,
  isAuthorizedUser,
  waitForGIS,
  GOOGLE_CLIENT_ID,
  SCOPES,
} from '../services/googleAuth';
import { setTokenRefresher, setSessionExpiredHandler } from '../services/googleDrive';

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
const TOKEN_KEY = 'context-viewer-access-token';
const TOKEN_EXPIRY_KEY = 'context-viewer-token-expiry';

// Persist token + expiry to localStorage
function storeToken(token: string, expiresIn: number) {
  const expiresAt = Date.now() + expiresIn * 1000;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiresAt));
}

// Restore token from localStorage if still valid (with 60s buffer)
function restoreToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (token && expiry && Date.now() < Number(expiry) - 60_000) {
    return token;
  }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  return null;
}

function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(null);
  // Promise-based deduplication for token refresh
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Request an access token via GIS token client (silent or with consent)
  const requestAccessToken = useCallback((prompt?: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!tokenClientRef.current) {
        resolve(null);
        return;
      }

      // Store the resolve on the ref so the callback can call it
      tokenCallbackRef.current = (token: string | null) => {
        resolve(token);
      };

      tokenClientRef.current.requestAccessToken({ prompt: prompt ?? '' });
    });
  }, []);

  // Callback ref for token client response
  const tokenCallbackRef = useRef<((token: string | null) => void) | null>(null);

  // Schedule a proactive token refresh before expiry
  const scheduleRefresh = useCallback((expiresIn: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    // Refresh 5 minutes before expiry, or at half-life if token is short-lived
    const refreshIn = Math.max((expiresIn - 300) * 1000, (expiresIn / 2) * 1000);
    refreshTimerRef.current = setTimeout(() => {
      requestAccessToken('').then((token) => {
        if (token) setAccessToken(token);
      });
    }, refreshIn);
  }, [requestAccessToken]);

  // Refresh access token with deduplication
  const refreshAccessToken = useCallback((): Promise<string | null> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const promise = requestAccessToken('').then((token) => {
      refreshPromiseRef.current = null;
      if (token) setAccessToken(token);
      return token;
    });

    refreshPromiseRef.current = promise;
    return promise;
  }, [requestAccessToken]);

  // Register the refresher and session-expired handler with googleDrive.ts
  useEffect(() => {
    setTokenRefresher(refreshAccessToken);
    setSessionExpiredHandler(() => {
      setAccessToken(null);
      clearStoredToken();
    });
  }, [refreshAccessToken]);

  // Initialize GIS on mount
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

        // Initialize GIS ID (sign-in with Google)
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            const decoded = decodeIdToken(response.credential);
            if (!isAuthorizedUser(decoded.email)) {
              setError('Unauthorized user');
              return;
            }
            setUser(decoded);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(decoded));
            setError(null);

            // After sign-in, request an access token for Drive
            requestAccessToken('consent').then((token) => {
              if (token) setAccessToken(token);
            });
          },
          auto_select: true,
        });

        // Initialize token client for Drive scopes
        tokenClientRef.current = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: (response) => {
            if (response.error) {
              tokenCallbackRef.current?.(null);
              return;
            }
            setAccessToken(response.access_token);
            storeToken(response.access_token, response.expires_in);
            scheduleRefresh(response.expires_in);
            tokenCallbackRef.current?.(response.access_token);
          },
          error_callback: () => {
            tokenCallbackRef.current?.(null);
          },
        });

        // If user is already stored, try restoring persisted token first
        if (stored) {
          const restoredToken = restoreToken();
          if (restoredToken) {
            setAccessToken(restoredToken);
            // Schedule refresh based on remaining time
            const expiry = Number(localStorage.getItem(TOKEN_EXPIRY_KEY));
            const remaining = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
            scheduleRefresh(remaining);
            setLoading(false);
          } else {
            // No valid stored token — try silent refresh
            const timeout = setTimeout(() => setLoading(false), 3000);
            requestAccessToken('').then((token) => {
              clearTimeout(timeout);
              if (token) setAccessToken(token);
              setLoading(false);
            });
          }
        } else {
          setLoading(false);
        }
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
    google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Prompt didn't show — request token directly (triggers consent)
        requestAccessToken('consent');
      }
    });
  }, [requestAccessToken]);

  const signOut = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    clearStoredToken();
    localStorage.removeItem(STORAGE_KEY);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
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
        requestToken: requestAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
