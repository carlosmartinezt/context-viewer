// Google OAuth configuration
// You'll need to replace this with your actual Client ID from Google Cloud Console
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Scopes needed for Google Drive access and user info
export const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
].join(' ');

// Allowed email addresses (whitelist)
const ALLOWED_EMAILS = [
  'carlosmartinezt@gmail.com',
  'lisvette.villar@gmail.com'
  // Add Jenny's email here
];

export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
  accessToken: string;
}

// Check if user is authorized
export function isAuthorizedUser(email: string): boolean {
  return ALLOWED_EMAILS.some(
    (allowed) => allowed.toLowerCase() === email.toLowerCase()
  );
}

// Initialize Google Identity Services
export function initGoogleAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error('Google Client ID not configured'));
      return;
    }

    // Load the Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

// Sign in with Google
export function signInWithGoogle(): Promise<GoogleUser> {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error('Google Identity Services not loaded'));
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: async (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || 'No access token received'));
          return;
        }

        const accessToken = response.access_token;

        // Get user info
        try {
          const userInfo = await fetch(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          const user = await userInfo.json();

          if (!isAuthorizedUser(user.email)) {
            reject(new Error('Unauthorized user'));
            return;
          }

          resolve({
            email: user.email,
            name: user.name,
            picture: user.picture,
            accessToken,
          });
        } catch (error) {
          reject(error);
        }
      },
    });

    client.requestAccessToken();
  });
}

// Type declaration for Google Identity Services
declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
            }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}
