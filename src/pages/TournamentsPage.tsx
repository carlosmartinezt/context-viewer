import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { findChessFolder, readChessFile } from '../services/googleDrive';
import { MarkdownViewer } from '../components/ui/MarkdownViewer';

export function TournamentsPage() {
  const { user } = useAuth();

  const { data: folderId } = useQuery({
    queryKey: ['chessFolder', user?.accessToken],
    queryFn: () => findChessFolder(user!.accessToken),
    enabled: !!user?.accessToken,
  });

  const { data: content, isLoading, error } = useQuery({
    queryKey: ['tournamentsFile', user?.accessToken, folderId],
    queryFn: () => readChessFile(user!.accessToken, folderId!, 'tournaments.md'),
    enabled: !!user?.accessToken && !!folderId,
  });

  if (error) {
    return (
      <div className="py-4">
        <div className="card bg-red-50 border border-red-200">
          <h3 className="font-semibold text-red-900 mb-2">Error</h3>
          <p className="text-sm text-red-700">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="card">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ) : content ? (
          <MarkdownViewer content={content} />
        ) : (
          <p className="text-gray-500">No content found</p>
        )}
      </div>
    </div>
  );
}
