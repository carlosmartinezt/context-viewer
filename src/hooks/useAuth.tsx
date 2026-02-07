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

  const tokenClientRef = useRef<google.accounts.oauth2.TokenClient | null>(null);
  // Promise-based deduplication for token refresh
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

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

  // Register the refresher with googleDrive.ts
  useEffect(() => {
    setTokenRefresher(refreshAccessToken);
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
            tokenCallbackRef.current?.(response.access_token);
          },
          error_callback: () => {
            tokenCallbackRef.current?.(null);
          },
        });

        // If user is already stored, try silent token refresh
        if (stored) {
          // Timeout: if silent refresh doesn't complete in 3s (e.g. popup blocked on mobile), stop loading anyway
          const timeout = setTimeout(() => setLoading(false), 3000);
          requestAccessToken('').then((token) => {
            clearTimeout(timeout);
            if (token) setAccessToken(token);
            setLoading(false);
          });
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
    localStorage.removeItem(STORAGE_KEY);
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
