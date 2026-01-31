import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-14 pb-20 px-4 max-w-lg mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
