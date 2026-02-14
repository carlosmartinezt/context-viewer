// Google OAuth configuration - GIS (Google Identity Services)
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Scopes needed for Google Drive access + OpenID for code flow id_token
export const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
].join(' ');

// Identity only — no access token stored here
export interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

// Check if user is authorized (kept for client-side pre-check; server also validates)
export function isAuthorizedUser(email: string): boolean {
  const ALLOWED_EMAILS = [
    'carlosmartinezt@gmail.com',
    'lisvette.villar@gmail.com',
    'cjmartinez@meta.com',
  ];
  return ALLOWED_EMAILS.some(
    (allowed) => allowed.toLowerCase() === email.toLowerCase()
  );
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
