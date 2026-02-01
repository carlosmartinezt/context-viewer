import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  type GoogleUser,
  initGoogleAuth,
  signInWithGoogle,
  parseOAuthCallback,
  fetchGoogleUserInfo,
  GOOGLE_CLIENT_ID,
} from '../services/googleAuth';

interface AuthContextType {
  user: GoogleUser | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  accessToken: string | null;
  handleOAuthCallback: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'chess-tracker-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle OAuth callback from URL hash
  const handleOAuthCallback = useCallback(async (): Promise<boolean> => {
    const callback = parseOAuthCallback();
    if (!callback) return false;

    try {
      setLoading(true);
      setError(null);
      const googleUser = await fetchGoogleUserInfo(callback.accessToken);
      setUser(googleUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize and check for OAuth callback or stored user
  useEffect(() => {
    async function init() {
      try {
        // First, check for OAuth callback in URL hash (redirect flow)
        const callback = parseOAuthCallback();
        if (callback) {
          const googleUser = await fetchGoogleUserInfo(callback.accessToken);
          setUser(googleUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
          setLoading(false);
          return;
        }

        // Check for stored user
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
        }

        // Initialize Google Auth
        if (GOOGLE_CLIENT_ID) {
          await initGoogleAuth();
        }
      } catch (err) {
        console.error('Auth init error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const signIn = async () => {
    try {
      setLoading(true);
      setError(null);
      // This will redirect to Google - won't return
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      setLoading(false);
      throw err;
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signOut,
        accessToken: user?.accessToken || null,
        handleOAuthCallback,
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
