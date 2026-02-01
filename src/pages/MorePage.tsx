import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { findChessFolder, listChessFiles } from '../services/googleDrive';

// Main files that have dedicated nav items
const MAIN_FILES = ['chess.md', 'coaches.md', 'tournaments.md', 'curriculum.md'];

// File to route mapping for main files
const FILE_ROUTES: Record<string, { route: string; icon: string; label: string }> = {
  'chess.md': { route: '/', icon: '📅', label: 'Home' },
  'coaches.md': { route: '/coaches', icon: '🎓', label: 'Coaches' },
  'tournaments.md': { route: '/tournaments', icon: '🏆', label: 'Tournaments' },
  'curriculum.md': { route: '/curriculum', icon: '📚', label: 'Curriculum' },
  'training.md': { route: '/file/training', icon: '🏋️', label: 'Training' },
};

export function MorePage() {
  const { user } = useAuth();

  const { data: folderId } = useQuery({
    queryKey: ['chessFolder', user?.accessToken],
    queryFn: () => findChessFolder(user!.accessToken),
    enabled: !!user?.accessToken,
  });

  const { data: files, isLoading } = useQuery({
    queryKey: ['allFiles', user?.accessToken, folderId],
    queryFn: () => listChessFiles(user!.accessToken, folderId!),
    enabled: !!user?.accessToken && !!folderId,
  });

  // Separate main files from additional files
  const additionalFiles = files?.filter((f) => !MAIN_FILES.includes(f.name)) || [];

  return (
    <div className="py-4 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">More</h2>

      {/* Additional Files */}
      <section>
        <h3 className="text-md font-medium text-gray-900 mb-2">Additional Files</h3>
        <div className="space-y-2">
          {isLoading ? (
            <div className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : additionalFiles.length > 0 ? (
            additionalFiles.map((file) => {
              const config = FILE_ROUTES[file.name];
              const route = config?.route || `/file/${file.name.replace('.md', '')}`;
              const icon = config?.icon || '📄';
              const label = config?.label || file.name.replace('.md', '');

              return (
                <Link
                  key={file.id}
                  to={route}
                  className="card flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xl">{icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{label}</div>
                    <div className="text-xs text-gray-500">{file.name}</div>
                  </div>
                  <span className="text-gray-400">→</span>
                </Link>
              );
            })
          ) : (
            <div className="card text-gray-500 text-sm">
              No additional files found
            </div>
          )}
        </div>
      </section>

      {/* Quick Links to Main Pages */}
      <section>
        <h3 className="text-md font-medium text-gray-900 mb-2">Main Pages</h3>
        <div className="grid grid-cols-2 gap-2">
          {MAIN_FILES.map((fileName) => {
            const config = FILE_ROUTES[fileName];
            if (!config) return null;
            return (
              <Link
                key={fileName}
                to={config.route}
                className="card flex items-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg">{config.icon}</span>
                <span className="text-sm font-medium text-gray-900">{config.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Settings Link */}
      <section>
        <Link
          to="/settings"
          className="card flex items-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <span className="text-xl">⚙️</span>
          <div className="flex-1">
            <div className="font-medium text-gray-900">Settings</div>
            <div className="text-xs text-gray-500">Account, refresh, sign out</div>
          </div>
          <span className="text-gray-400">→</span>
        </Link>
      </section>
    </div>
  );
}
