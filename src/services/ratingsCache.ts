import type { USCFRatingData } from '../types';

const CACHE_FILE_NAME = 'ratings-cache.json';

interface RatingsCache {
  [uscfId: string]: USCFRatingData;
}

/**
 * Find the ratings cache file in the chess folder
 */
async function findCacheFile(accessToken: string, folderId: string): Promise<string | null> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${CACHE_FILE_NAME}' and '${folderId}' in parents and trashed=false&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  return data.files?.[0]?.id || null;
}

/**
 * Read the ratings cache from Google Drive
 */
export async function readRatingsCache(accessToken: string, folderId: string): Promise<RatingsCache> {
  try {
    const fileId = await findCacheFile(accessToken, folderId);
    if (!fileId) return {};

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) return {};

    return await response.json();
  } catch {
    return {};
  }
}

/**
 * Save a rating to the cache in Google Drive
 */
export async function saveRatingToCache(
  accessToken: string,
  folderId: string,
  uscfId: string,
  ratingData: USCFRatingData
): Promise<void> {
  try {
    // Read existing cache
    const cache = await readRatingsCache(accessToken, folderId);

    // Update with new rating
    cache[uscfId] = ratingData;

    const fileId = await findCacheFile(accessToken, folderId);
    const content = JSON.stringify(cache, null, 2);

    if (fileId) {
      // Update existing file
      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: content,
        }
      );
    } else {
      // Create new file
      const metadata = {
        name: CACHE_FILE_NAME,
        parents: [folderId],
        mimeType: 'application/json',
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([content], { type: 'application/json' }));

      await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: form,
        }
      );
    }
  } catch (error) {
    console.error('Failed to save rating to cache:', error);
  }
}
