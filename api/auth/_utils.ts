// Shared constants for auth serverless functions

export const ALLOWED_EMAILS = [
  'carlosmartinezt@gmail.com',
  'lisvette.villar@gmail.com',
  'cjmartinez@meta.com',
];

const COOKIE_NAME = 'auth_refresh_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

export function getCookieOptions(refreshToken: string): string {
  const isProduction = process.env.VERCEL_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=${refreshToken}`,
    `HttpOnly`,
    `Path=/`,
    `SameSite=Lax`,
    `Max-Age=${COOKIE_MAX_AGE}`,
  ];
  if (isProduction) parts.push('Secure');
  return parts.join('; ');
}

export function clearCookie(): string {
  const isProduction = process.env.VERCEL_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=`,
    `HttpOnly`,
    `Path=/`,
    `SameSite=Lax`,
    `Max-Age=0`,
  ];
  if (isProduction) parts.push('Secure');
  return parts.join('; ');
}

export function getRefreshTokenFromCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  return match ? match[1] : null;
}
