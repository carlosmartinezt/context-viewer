import type { VercelRequest, VercelResponse } from '@vercel/node';

interface USCFAPIResponse {
  id: string;
  firstName: string;
  lastName: string;
  ratings: Array<{
    rating?: number;
    ratingSystem: string;
    isProvisional: boolean;
    floor?: number;
  }>;
  stateRep?: string;
  expirationDate?: string;
  status?: string;
}

interface USCFRatingData {
  regular?: number;
  quick?: number;
  blitz?: number;
  name?: string;
  state?: string;
  memberExpiration?: string;
  fetchedAt: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string' || id.length < 6) {
    return res.status(400).json({ error: 'Invalid USCF ID' });
  }

  try {
    // Use the USCF MUIR API
    const url = `https://ratings-api.uschess.org/api/v1/members/${id}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ChessTracker/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `USCF API returned ${response.status}`
      });
    }

    const data: USCFAPIResponse = await response.json();
    const ratingData = parseUSCFAPIResponse(data);

    return res.status(200).json(ratingData);
  } catch (error) {
    console.error('USCF fetch error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch rating'
    });
  }
}

function parseUSCFAPIResponse(data: USCFAPIResponse): USCFRatingData {
  const ratingData: USCFRatingData = {
    name: `${data.firstName} ${data.lastName}`.trim(),
    state: data.stateRep,
    memberExpiration: data.expirationDate,
    fetchedAt: new Date().toISOString(),
  };

  // Parse ratings by system
  // R = Regular, Q = Quick, B = Blitz
  // OR = Online Regular, OQ = Online Quick, OB = Online Blitz
  for (const r of data.ratings) {
    if (r.rating === undefined) continue;

    switch (r.ratingSystem) {
      case 'R':
        ratingData.regular = r.rating;
        break;
      case 'Q':
        ratingData.quick = r.rating;
        break;
      case 'B':
        ratingData.blitz = r.rating;
        break;
    }
  }

  return ratingData;
}
