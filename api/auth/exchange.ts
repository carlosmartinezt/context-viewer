import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ALLOWED_EMAILS, getCookieOptions } from './_utils.js';

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  scope: string;
  token_type: string;
}

interface GoogleUser {
  email: string;
  name: string;
  picture: string;
}

function decodeIdToken(idToken: string): GoogleUser {
  const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
  return {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body as { code?: string };
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: 'postmessage',
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Token exchange failed:', err);
      return res.status(401).json({ error: 'Token exchange failed' });
    }

    const tokens = await tokenRes.json() as GoogleTokenResponse;

    // Decode ID token for user info
    if (!tokens.id_token) {
      return res.status(400).json({ error: 'No id_token returned' });
    }

    const user = decodeIdToken(tokens.id_token);

    // Validate whitelist
    if (!ALLOWED_EMAILS.some((e) => e.toLowerCase() === user.email.toLowerCase())) {
      return res.status(403).json({ error: 'Unauthorized user' });
    }

    // Set refresh token as HTTP-only cookie (only if present — first auth gives it)
    if (tokens.refresh_token) {
      res.setHeader('Set-Cookie', getCookieOptions(tokens.refresh_token));
    }

    return res.status(200).json({
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      user,
    });
  } catch (err) {
    console.error('Exchange error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
