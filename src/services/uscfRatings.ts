import type { USCFRatingData } from '../types';

/**
 * Fetches USCF rating data for a player
 * @param uscfId - 8-digit USCF member ID
 * @returns USCFRatingData with current ratings
 */
export async function fetchUSCFRating(uscfId: string): Promise<USCFRatingData> {
  if (!uscfId || uscfId.length < 6) {
    throw new Error('Invalid USCF ID');
  }

  // Try the API endpoint first
  try {
    const apiUrl = `https://ratings-api.uschess.org/v1/player/${uscfId}`;
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return parseUSCFAPIData(data);
    }
  } catch (error) {
    console.log('API fetch failed, trying HTML fallback:', error);
  }

  // Fallback: Try fetching the HTML page via CORS proxy
  try {
    const htmlUrl = `https://ratings.uschess.org/player/${uscfId}`;
    // Use CORS proxy to bypass CORS restrictions
    const proxiedUrl = `https://corsproxy.io/?${encodeURIComponent(htmlUrl)}`;
    const response = await fetch(proxiedUrl, {
      headers: {
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error(`USCF request failed: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    return parseUSCFHTML(html);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch USCF rating: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Parse USCF API response (if API exists)
 */
function parseUSCFAPIData(data: any): USCFRatingData {
  // This is speculative - adjust based on actual API response
  return {
    regular: data.regular_rating || data.rating,
    quick: data.quick_rating,
    blitz: data.blitz_rating,
    onlineRegular: data.online_regular_rating,
    onlineQuick: data.online_quick_rating,
    onlineBlitz: data.online_blitz_rating,
    name: data.name,
    memberExpiration: data.expiration,
  };
}

/**
 * Parse USCF HTML page to extract rating data
 * This uses DOMParser to parse the HTML and extract ratings
 */
function parseUSCFHTML(html: string): USCFRatingData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Look for common patterns in USCF rating pages
  // This is a best-effort parsing that will need adjustment based on actual HTML structure
  const ratingData: USCFRatingData = {};

  // Try to find the player name
  const nameElement = doc.querySelector('h1, h2, .player-name, [class*="name"]');
  if (nameElement) {
    ratingData.name = nameElement.textContent?.trim();
  }

  // Look for rating values - these selectors are educated guesses
  // We'll need to adjust based on actual HTML structure
  const ratings = doc.querySelectorAll('[class*="rating"], .rating-value, td');

  for (const element of ratings) {
    const text = element.textContent?.trim() || '';
    const value = parseInt(text);

    if (isNaN(value) || value < 100 || value > 3000) continue;

    const label = element.previousElementSibling?.textContent?.toLowerCase() ||
                  element.parentElement?.textContent?.toLowerCase() || '';

    if (label.includes('regular') && !label.includes('online')) {
      ratingData.regular = value;
    } else if (label.includes('quick') && !label.includes('online')) {
      ratingData.quick = value;
    } else if (label.includes('blitz') && !label.includes('online')) {
      ratingData.blitz = value;
    } else if (label.includes('online') && label.includes('regular')) {
      ratingData.onlineRegular = value;
    } else if (label.includes('online') && label.includes('quick')) {
      ratingData.onlineQuick = value;
    } else if (label.includes('online') && label.includes('blitz')) {
      ratingData.onlineBlitz = value;
    }
  }

  // If we didn't find any ratings, throw an error
  if (!ratingData.regular && !ratingData.quick && !ratingData.blitz) {
    throw new Error('Could not parse rating data from USCF page. The page structure may have changed.');
  }

  return ratingData;
}

/**
 * Get the direct URL to a player's USCF profile page
 */
export function getUSCFProfileUrl(uscfId: string): string {
  return `https://ratings.uschess.org/player/${uscfId}`;
}
