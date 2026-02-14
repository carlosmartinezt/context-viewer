import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRefreshTokenFromCookie, clearCookie } from './_utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const refreshToken = getRefreshTokenFromCookie(req.headers.cookie);

  // Best-effort revocation with Google
  if (refreshToken) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${refreshToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } catch {
      // Ignore revocation errors — we clear the cookie regardless
    }
  }

  // Always clear the cookie
  res.setHeader('Set-Cookie', clearCookie());
  return res.status(200).json({ success: true });
}
