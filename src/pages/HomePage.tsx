import { useAuth } from '../hooks/useAuth';

// Placeholder data - will be replaced with data from Google Drive
const players = [
  { name: 'Rapha', rating: 1700, age: 9 },
  { name: 'Rory', rating: 900, age: 7 },
];

const thisWeek = [
  {
    id: 1,
    date: 'Mon 2/3',
    time: '4:00 PM',
    player: 'Rapha',
    coach: 'Kim Steven',
    focus: 'Tactics',
    type: 'lesson',
  },
  {
    id: 2,
    date: 'Wed 2/5',
    time: '5:00 PM',
    player: 'Rory',
    coach: 'Yeisson',
    focus: 'Openings',
    type: 'lesson',
  },
  {
    id: 3,
    date: 'Sat 2/8',
    time: '9:00 AM',
    player: 'Both',
    location: 'Brooklyn Scholastic',
    type: 'tournament',
  },
];

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="py-4 space-y-6">
      {/* Player Cards */}
      <div className="grid grid-cols-2 gap-3">
        {players.map((player) => (
          <div
            key={player.name}
            className="card card-hover text-center cursor-pointer"
          >
            <div className="text-3xl mb-2">
              {player.name === 'Rapha' ? '👧' : '👦'}
            </div>
            <div className="font-semibold text-gray-900">{player.name}</div>
            <div className="text-2xl font-bold text-blue-600">
              {player.rating}
            </div>
            <div className="text-xs text-gray-500">Age {player.age}</div>
          </div>
        ))}
      </div>

      {/* This Week */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          📅 This Week
        </h2>
        <div className="space-y-2">
          {thisWeek.map((event) => (
            <div
              key={event.id}
              className={`card card-hover cursor-pointer ${
                event.type === 'tournament'
                  ? 'border-l-4 border-l-amber-500'
                  : 'border-l-4 border-l-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{event.date}</span>
                    <span>·</span>
                    <span>{event.time}</span>
                  </div>
                  <div className="font-medium text-gray-900 mt-1">
                    {event.type === 'tournament' ? (
                      <>
                        🏆 {event.location}
                      </>
                    ) : (
                      <>
                        {event.player} → {event.coach}
                      </>
                    )}
                  </div>
                  {event.focus && (
                    <div className="text-sm text-gray-500 mt-0.5">
                      {event.focus}
                    </div>
                  )}
                </div>
                {event.type === 'tournament' && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {event.player}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
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
