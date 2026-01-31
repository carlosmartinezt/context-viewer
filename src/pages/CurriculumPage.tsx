const curriculum = {
  openings: [
    { name: 'Italian Game', status: 'solid', player: 'Rapha' },
    { name: 'Sicilian Defense', status: 'learning', player: 'Rapha' },
    { name: 'London System', status: 'learning', player: 'Rory' },
  ],
  tactics: [
    { name: 'Forks', status: 'solid' },
    { name: 'Pins', status: 'solid' },
    { name: 'Discovered Attacks', status: 'learning' },
    { name: 'Back Rank Mates', status: 'practicing' },
  ],
  endgames: [
    { name: 'King + Queen vs King', status: 'solid' },
    { name: 'King + Rook vs King', status: 'practicing' },
    { name: 'Lucena Position', status: 'learning' },
  ],
};

const statusColors = {
  solid: 'bg-green-100 text-green-700',
  practicing: 'bg-blue-100 text-blue-700',
  learning: 'bg-amber-100 text-amber-700',
};

export function CurriculumPage() {
  return (
    <div className="py-4 space-y-6">
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          ♟️ Openings
        </h2>
        <div className="space-y-2">
          {curriculum.openings.map((item) => (
            <div key={item.name} className="card card-hover cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{item.name}</div>
                  {item.player && (
                    <div className="text-xs text-gray-500">{item.player}</div>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    statusColors[item.status as keyof typeof statusColors]
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          🧩 Tactics
        </h2>
        <div className="space-y-2">
          {curriculum.tactics.map((item) => (
            <div key={item.name} className="card card-hover cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900">{item.name}</div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    statusColors[item.status as keyof typeof statusColors]
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          🏁 Endgames
        </h2>
        <div className="space-y-2">
          {curriculum.endgames.map((item) => (
            <div key={item.name} className="card card-hover cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="font-medium text-gray-900">{item.name}</div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    statusColors[item.status as keyof typeof statusColors]
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
