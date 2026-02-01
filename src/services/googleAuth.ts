// Google OAuth configuration
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

// Initialize Google Auth - just check configuration
export function initGoogleAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID) {
      reject(new Error('Google Client ID not configured'));
      return;
    }
    resolve();
  });
}

// Start OAuth flow - redirects to Google
export function signInWithGoogle(): Promise<GoogleUser> {
  // Build the OAuth URL for implicit grant flow
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: window.location.origin,
    response_type: 'token',
    scope: SCOPES,
    include_granted_scopes: 'true',
    state: 'login',
  });

  // Redirect to Google OAuth
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  // This promise won't resolve - we're redirecting away
  return new Promise(() => {});
}

// Parse OAuth callback from URL hash
export function parseOAuthCallback(): { accessToken: string } | null {
  const hash = window.location.hash.substring(1);
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const state = params.get('state');

  if (accessToken && state === 'login') {
    // Clear the hash from URL
    window.history.replaceState(null, '', window.location.pathname);
    return { accessToken };
  }

  return null;
}

// Fetch user info from Google
export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUser> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }

  const user = await response.json();

  if (!isAuthorizedUser(user.email)) {
    throw new Error('Unauthorized user');
  }

  return {
    email: user.email,
    name: user.name,
    picture: user.picture,
    accessToken,
  };
}
