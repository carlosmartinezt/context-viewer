import { useQuery } from '@tanstack/react-query';
import { fetchUSCFRating } from '../services/uscfRatings';
import type { USCFRatingData } from '../types';

/**
 * React Query hook for fetching USCF ratings
 *
 * Manual refresh only - ratings don't change often (only after tournaments)
 * - enabled: false prevents automatic fetching on mount
 * - Use refetch() to manually trigger a rating update
 * - Results are cached indefinitely until next manual refresh
 *
 * @param uscfId - 8-digit USCF member ID
 * @returns Query result with rating data, loading state, and refetch function
 */
export function useUSCFRating(uscfId: string | undefined) {
  return useQuery<USCFRatingData, Error>({
    queryKey: ['uscf-rating', uscfId],
    queryFn: () => fetchUSCFRating(uscfId!),
    enabled: false, // Manual only - never auto-fetch
    staleTime: Infinity, // Cache forever until manual refresh
    gcTime: Infinity, // Keep in cache indefinitely (formerly cacheTime)
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}
