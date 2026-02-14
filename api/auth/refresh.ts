import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRefreshTokenFromCookie, clearCookie } from './_utils.js';

interface GoogleRefreshResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const refreshToken = getRefreshTokenFromCookie(req.headers.cookie);
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Refresh failed:', err);
      // invalid_grant means the refresh token is revoked or expired
      res.setHeader('Set-Cookie', clearCookie());
      return res.status(401).json({ error: 'Refresh token invalid' });
    }

    const tokens = await tokenRes.json() as GoogleRefreshResponse;

    return res.status(200).json({
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
    });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
