import { useAuth } from '../hooks/useAuth';
import { useUSCFRating } from '../hooks/useUSCFRating';
import { useQuery } from '@tanstack/react-query';
import type { Player, Lesson, Tournament } from '../types';
import { findChessFolder, fetchChessData, fetchCoachesData, fetchTournamentsData } from '../services/googleDrive';

// Player emoji mapping
const PLAYER_EMOJIS: Record<string, string> = {
  rapha: '👧',
  rory: '👦',
};

// Player card component with USCF rating refresh
function PlayerCard({ player }: { player: Player & { emoji: string } }) {
  const { data: uscfData, isLoading, error, refetch } = useUSCFRating(player.uscfId);

  const handleRefresh = async () => {
    if (player.uscfId) {
      await refetch();
    }
  };

  // Use USCF regular rating if available, otherwise use stored rating
  const displayRating = uscfData?.regular ?? player.currentRating;

  return (
    <div className="card text-center relative">
      <div className="text-3xl mb-2">{player.emoji}</div>
      <div className="font-semibold text-gray-900">{player.name}</div>
      <div className="text-2xl font-bold text-blue-600">
        {displayRating}
      </div>
      <div className="text-xs text-gray-500">Age {player.age}</div>

      {/* Refresh button - only show if USCF ID exists */}
      {player.uscfId && (
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="Refresh USCF rating"
        >
          {isLoading ? (
            <span className="text-xs">⏳</span>
          ) : (
            <span className="text-xs">🔄</span>
          )}
        </button>
      )}

      {/* Show error if fetch failed */}
      {error && (
        <div className="text-xs text-red-500 mt-1">
          Failed to fetch
        </div>
      )}

      {/* Show last update time if available */}
      {player.lastRatingUpdate && !isLoading && (
        <div className="text-xs text-gray-400 mt-1">
          Updated {formatUpdateTime(player.lastRatingUpdate)}
        </div>
      )}
    </div>
  );
}

// Format the last update timestamp to relative time
function formatUpdateTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export function HomePage() {
  const { user } = useAuth();

  // Fetch chess folder
  const { data: folderId } = useQuery({
    queryKey: ['chessFolder', user?.accessToken],
    queryFn: () => findChessFolder(user!.accessToken),
    enabled: !!user?.accessToken,
  });

  // Fetch chess data (players)
  const { data: chessData, isLoading: isLoadingChess } = useQuery({
    queryKey: ['chessData', user?.accessToken, folderId],
    queryFn: () => fetchChessData(user!.accessToken, folderId!),
    enabled: !!user?.accessToken && !!folderId,
  });

  // Fetch coaches data (lessons)
  const { data: coachesData, isLoading: isLoadingCoaches } = useQuery({
    queryKey: ['coachesData', user?.accessToken, folderId],
    queryFn: () => fetchCoachesData(user!.accessToken, folderId!),
    enabled: !!user?.accessToken && !!folderId,
  });

  // Fetch tournaments data
  const { data: tournamentsData, isLoading: isLoadingTournaments } = useQuery({
    queryKey: ['tournamentsData', user?.accessToken, folderId],
    queryFn: () => fetchTournamentsData(user!.accessToken, folderId!),
    enabled: !!user?.accessToken && !!folderId,
  });

  const players = chessData?.players || [];
  const lessons = coachesData?.lessons || [];
  const upcomingTournaments = tournamentsData?.tournaments.filter(t =>
    t.status === 'confirmed' || t.status === 'registered'
  ) || [];

  // Combine lessons and tournaments for "This Week" view
  type WeekEvent =
    | ({ eventType: 'lesson' } & Lesson)
    | ({ eventType: 'tournament' } & Tournament);

  const thisWeek: WeekEvent[] = [
    ...lessons.map(l => ({ ...l, eventType: 'lesson' as const })),
    ...upcomingTournaments.map(t => ({ ...t, eventType: 'tournament' as const })),
  ].slice(0, 5);

  const isLoading = isLoadingChess || isLoadingCoaches || isLoadingTournaments;

  return (
    <div className="py-4 space-y-6">
      {/* Player Cards */}
      <div className="grid grid-cols-2 gap-3">
        {isLoading ? (
          <>
            <div className="card animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
            <div className="card animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </>
        ) : (
          players.map((player) => {
            const emoji = PLAYER_EMOJIS[player.id] || '🧒';
            return (
              <PlayerCard
                key={player.id}
                player={{
                  ...player,
                  emoji,
                  currentRating: player.rating,
                  uscfId: chessData?.onlineAccounts
                    .find(a => a.platform === 'USCF' && a.playerId === player.id)
                    ?.username || undefined
                }}
              />
            );
          })
        )}
      </div>

      {/* This Week */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          📅 This Week
        </h2>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : thisWeek.length === 0 ? (
          <div className="card text-center text-gray-500">
            No upcoming lessons or tournaments
          </div>
        ) : (
          <div className="space-y-2">
            {thisWeek.map((event) => (
              <div
                key={event.id}
                className={`card card-hover cursor-pointer ${
                  event.eventType === 'tournament'
                    ? 'border-l-4 border-l-amber-500'
                    : 'border-l-4 border-l-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{event.date}</span>
                      {event.eventType === 'lesson' && (
                        <>
                          <span>·</span>
                          <span>{event.time}</span>
                        </>
                      )}
                    </div>
                    <div className="font-medium text-gray-900 mt-1">
                      {event.eventType === 'tournament' ? (
                        <>
                          🏆 {event.name}
                        </>
                      ) : (
                        <>
                          {event.player} → {event.coach}
                        </>
                      )}
                    </div>
                    {event.eventType === 'lesson' && event.focus && (
                      <div className="text-sm text-gray-500 mt-0.5">
                        {event.focus}
                      </div>
                    )}
                    {event.eventType === 'tournament' && event.location && (
                      <div className="text-sm text-gray-500 mt-0.5">
                        {event.location}
                      </div>
                    )}
                  </div>
                  {event.eventType === 'tournament' && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      {event.players.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button className="btn-primary flex-1 flex items-center justify-center gap-2">
          <span>+</span>
          <span>Lesson</span>
        </button>
        <button className="btn-secondary flex-1 flex items-center justify-center gap-2">
          <span>+</span>
          <span>Tournament</span>
        </button>
      </div>

      {/* Debug info - remove in production */}
      {user && (
        <div className="text-xs text-gray-400 text-center">
          Signed in as {user.email}
        </div>
      )}
    </div>
  );
}
