import { useAuth } from '../../hooks/useAuth';
import { ProfileAvatar } from '../ui/ProfileAvatar';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 h-[var(--header-height)] bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-subtle)] z-20">
      <div className="flex items-center justify-between h-full px-3 lg:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[var(--color-accent)] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-base font-semibold text-[var(--color-text)] tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Context Viewer
          </h1>
        </div>

        {/* User */}
        {user && (
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-2 py-1.5 -mr-2 rounded-lg hover:bg-[var(--color-bg-subtle)] transition-colors"
            title={`Sign out (${user.email})`}
          >
            <span className="hidden sm:block text-sm text-[var(--color-text-secondary)]">
              {user.name.split(' ')[0]}
            </span>
            <ProfileAvatar src={user.picture} name={user.name} size="sm" />
          </button>
        )}
      </div>
    </header>
  );
}
