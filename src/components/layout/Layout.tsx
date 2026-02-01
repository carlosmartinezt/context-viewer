import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { VoiceInput } from '../ui/VoiceInput';
import { useAuth } from '../../hooks/useAuth';

export function Layout() {
  const location = useLocation();
  const { user } = useAuth();
  const hideVoiceInputPaths = ['/settings', '/more'];
  const showVoiceInput = !hideVoiceInputPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="pt-14 pb-20 px-4 max-w-lg mx-auto">
        <Outlet />

        {/* Voice Input - available on all pages except settings */}
        {showVoiceInput && user && (
          <section className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              💬 Ask Claude
            </h2>
            <VoiceInput
              userEmail={user.email}
              placeholder="What's happening with chess?"
            />
          </section>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
