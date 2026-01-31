import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">♟️</span>
          <h1 className="text-lg font-semibold text-gray-900">Chess Tracker</h1>
        </div>

        {user && (
          <button
            onClick={signOut}
            className="flex items-center gap-2"
            title={user.email}
          >
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {user.name.charAt(0)}
                </span>
              </div>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
