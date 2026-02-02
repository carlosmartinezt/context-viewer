import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="page-container">
      <Header />

      {/* Desktop sidebar - hidden on mobile */}
      <Sidebar />

      {/* Main content area */}
      <main className="pt-16 pb-20 lg:pb-8 lg:pl-64">
        <div className="content-area">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav - hidden on desktop */}
      <BottomNav />
    </div>
  );
}
