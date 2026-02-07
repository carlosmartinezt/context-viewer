// Google OAuth configuration - GIS (Google Identity Services)
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Scopes needed for Google Drive access
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
].join(' ');

// Allowed email addresses (whitelist)
const ALLOWED_EMAILS = [
  'carlosmartinezt@gmail.com',
  'lisvette.villar@gmail.com',
  'cjmartinez@meta.com',
];

// Identity only — no access token stored here
export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

// Check if user is authorized
export function isAuthorizedUser(email: string): boolean {
  return ALLOWED_EMAILS.some(
    (allowed) => allowed.toLowerCase() === email.toLowerCase()
  );
}

// Decode the JWT ID token from GIS sign-in to extract user info
export function decodeIdToken(credential: string): GoogleUser {
  const payload = JSON.parse(atob(credential.split('.')[1]));
  return {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}

// Wait for the GIS script to load
export function waitForGIS(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof google !== 'undefined' && google.accounts) {
      resolve();
      return;
    }
    const interval = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}
