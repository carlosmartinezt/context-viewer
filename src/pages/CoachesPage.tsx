const coaches = [
  { name: 'Yeisson Gutierrez', students: ['Rapha', 'Rory'] },
  { name: 'Kim Steven Yap', students: ['Rapha', 'Rory'] },
  { name: 'Jerich Cajeras', students: ['Rapha', 'Rory'] },
];

export function CoachesPage() {
  return (
    <div className="py-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">🎓 Coaches</h2>

      <div className="space-y-3">
        {coaches.map((coach) => (
          <div key={coach.name} className="card card-hover cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{coach.name}</div>
                <div className="text-sm text-gray-500">
                  Students: {coach.students.join(', ')}
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 mt-8">
        <p>Tap a coach to view schedule and details</p>
      </div>
    </div>
  );
}
