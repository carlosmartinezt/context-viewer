import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../hooks/useAuth';

export function Layout() {
  const { user, accessToken, loading, requestToken } = useAuth();
  const [reconnecting, setReconnecting] = useState(false);
  const needsReconnect = !loading && !!user && !accessToken;

  const handleReconnect = async () => {
    setReconnecting(true);
    try {
      await requestToken('consent');
    } finally {
      setReconnecting(false);
    }
  };

  return (
    <div className="page-container">
      <Header />

      {/* Desktop sidebar - hidden on mobile */}
      <Sidebar />

      {/* Main content area */}
      <main className="pt-[var(--header-height)] pb-[calc(var(--nav-height)+0.5rem)] lg:pb-8 lg:pl-64">
        <div className="content-area">
          {needsReconnect && (
            <div className="mx-4 mt-4 p-4 rounded-xl bg-[var(--color-accent-subtle)] border border-[var(--color-accent)] flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Session expired. Tap to reconnect.
              </p>
              <button
                onClick={handleReconnect}
                disabled={reconnecting}
                className="btn-primary text-sm px-4 py-2 flex-shrink-0"
              >
                {reconnecting ? 'Connecting...' : 'Reconnect'}
              </button>
            </div>
          )}
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav - hidden on desktop */}
      <BottomNav />
    </div>
  );
}
