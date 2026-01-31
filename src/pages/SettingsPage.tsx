import { useAuth } from '../hooks/useAuth';

export function SettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="py-4 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">⚙️ Settings</h2>

      {/* User Info */}
      {user && (
        <div className="card">
          <div className="flex items-center gap-4">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium text-lg">
                  {user.name.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <div className="font-medium text-gray-900">{user.name}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>
        </div>
      )}

      {/* Online Accounts */}
      <section>
        <h3 className="text-md font-medium text-gray-900 mb-2">
          🌐 Chess Accounts
        </h3>
        <div className="card space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">USCF</span>
            <span className="text-sm text-blue-600">Connected ✓</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Chess.com</span>
            <span className="text-sm text-blue-600">Connected ✓</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Lichess</span>
            <span className="text-sm text-blue-600">Connected ✓</span>
          </div>
        </div>
      </section>

      {/* Data Source */}
      <section>
        <h3 className="text-md font-medium text-gray-900 mb-2">
          📁 Data Source
        </h3>
        <div className="card">
          <div className="text-sm text-gray-600">
            <p>Connected to Google Drive</p>
            <p className="text-xs text-gray-400 mt-1">
              ~/gdrive/claude/02_areas/chess/
            </p>
          </div>
        </div>
      </section>

      {/* Sign Out */}
      <button
        onClick={signOut}
        className="w-full py-3 text-red-600 font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
      >
        Sign Out
      </button>

      {/* Version */}
      <div className="text-center text-xs text-gray-400">
        Chess Tracker v0.1.0
      </div>
    </div>
  );
}
