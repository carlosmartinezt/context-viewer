import { useAuth } from '../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  const handleForceRefresh = () => {
    queryClient.invalidateQueries();
  };

  const handleForceRelogin = () => {
    localStorage.removeItem('chess-tracker-user');
    window.location.reload();
  };

  return (
    <div className="py-4 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Settings</h2>

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

      {/* Data Source */}
      <section>
        <h3 className="text-md font-medium text-gray-900 mb-2">
          Data Source
        </h3>
        <div className="card">
          <div className="text-sm text-gray-600">
            <p>Connected to Google Drive</p>
            <p className="text-xs text-gray-400 mt-1">
              ~/gdrive/02_areas/chess/
            </p>
          </div>
        </div>
      </section>

      {/* Useful Links */}
      <section>
        <h3 className="text-md font-medium text-gray-900 mb-2">
          Useful Links
        </h3>
        <div className="card space-y-2">
          <a
            href="https://new.uschess.org/players/search"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-blue-600 hover:underline"
          >
            Find USCF ID
          </a>
          <a
            href="https://ratings.uschess.org"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-blue-600 hover:underline"
          >
            USCF Ratings Lookup
          </a>
        </div>
      </section>

      {/* Actions */}
      <section>
        <h3 className="text-md font-medium text-gray-900 mb-2">Actions</h3>
        <div className="space-y-2">
          <button
            onClick={handleForceRefresh}
            className="w-full py-3 text-blue-600 font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Refresh Data
          </button>
          <button
            onClick={handleForceRelogin}
            className="w-full py-3 text-amber-600 font-medium border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors"
          >
            Force Re-login
          </button>
          <button
            onClick={signOut}
            className="w-full py-3 text-red-600 font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </section>

      {/* Version */}
      <div className="text-center text-xs text-gray-400">
        Chess Tracker v0.2.0
      </div>
    </div>
  );
}
