const tournaments = {
  upcoming: [
    {
      date: '2025-02-08',
      name: 'Brooklyn Scholastic',
      location: 'Brooklyn',
      players: ['Rapha', 'Rory'],
      type: 'local',
    },
    {
      date: '2025-03-15',
      name: 'State Championship',
      location: 'Albany, NY',
      players: ['Rapha'],
      type: 'travel',
      bookHotelBy: '2025-02-01',
    },
  ],
  past: [
    {
      date: '2025-01-25',
      name: 'NYC Scholastic',
      players: ['Rapha', 'Rory'],
    },
  ],
};

export function TournamentsPage() {
  return (
    <div className="py-4 space-y-6">
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          🏆 Upcoming Tournaments
        </h2>
        <div className="space-y-3">
          {tournaments.upcoming.map((t) => (
            <div
              key={t.name}
              className={`card card-hover cursor-pointer ${
                t.type === 'travel'
                  ? 'border-l-4 border-l-purple-500'
                  : 'border-l-4 border-l-amber-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500">{t.date}</div>
                  <div className="font-medium text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.location}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {t.players.join(', ')}
                  </span>
                  {t.type === 'travel' && (
                    <div className="text-xs text-purple-600 mt-1">✈️ Travel</div>
                  )}
                </div>
              </div>
              {t.bookHotelBy && (
                <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  🏨 Book hotel by {t.bookHotelBy}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          📜 Past Results
        </h2>
        <div className="space-y-2">
          {tournaments.past.map((t) => (
            <div key={t.name} className="card text-gray-500">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm">{t.date}</div>
                  <div className="font-medium text-gray-700">{t.name}</div>
                </div>
                <span className="text-xs">{t.players.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
