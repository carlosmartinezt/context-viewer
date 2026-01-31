import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import {
  type GoogleUser,
  initGoogleAuth,
  signInWithGoogle,
  GOOGLE_CLIENT_ID,
} from '../services/googleAuth';

interface AuthContextType {
  user: GoogleUser | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'chess-tracker-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Auth and check for stored user
  useEffect(() => {
    async function init() {
      try {
        // Check for stored user (token may be expired, will need re-auth)
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Note: Access token will likely be expired, but we keep user info
          // They'll need to re-authenticate to get a fresh token
          setUser(parsed);
        }

        // Initialize Google Auth
        if (GOOGLE_CLIENT_ID) {
          await initGoogleAuth();
        }
      } catch (err) {
        console.error('Auth init error:', err);
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
      const googleUser = await signInWithGoogle();
      setUser(googleUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      throw err;
    } finally {
      setLoading(false);
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
