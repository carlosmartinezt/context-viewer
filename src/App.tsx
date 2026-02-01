import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { CoachesPage } from './pages/CoachesPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { CurriculumPage } from './pages/CurriculumPage';
import { SettingsPage } from './pages/SettingsPage';
import { MorePage } from './pages/MorePage';
import { FilePage } from './pages/FilePage';
import { LoginPage } from './pages/LoginPage';

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">♟️</div>
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="coaches" element={<CoachesPage />} />
        <Route path="tournaments" element={<TournamentsPage />} />
        <Route path="curriculum" element={<CurriculumPage />} />
        <Route path="more" element={<MorePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="file/:filename" element={<FilePage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
