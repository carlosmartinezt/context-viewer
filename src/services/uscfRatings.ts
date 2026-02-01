import type { USCFRatingData } from '../types';

/**
 * Fetches USCF rating data for a player
 * Uses our serverless API to avoid CORS issues
 * @param uscfId - 8-digit USCF member ID
 * @returns USCFRatingData with current ratings
 */
export async function fetchUSCFRating(uscfId: string): Promise<USCFRatingData> {
  if (!uscfId || uscfId.length < 6) {
    throw new Error('Invalid USCF ID');
  }

  // Use our own serverless API (no CORS issues)
  const apiUrl = `/api/uscf-rating?id=${uscfId}`;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Failed to fetch rating: ${response.status}`);
  }

  const data = await response.json();

  if (!data.regular && !data.quick && !data.blitz) {
    throw new Error('No rating data found');
  }

  return data;
}

/**
 * Get the direct URL to a player's USCF profile page
 */
export function getUSCFProfileUrl(uscfId: string): string {
  return `https://ratings.uschess.org/player/${uscfId}`;
}
