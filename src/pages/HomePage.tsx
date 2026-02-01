import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { findChessFolder, readChessFile } from '../services/googleDrive';
import { MarkdownViewer } from '../components/ui/MarkdownViewer';

export function HomePage() {
  const { user } = useAuth();

  // Fetch chess folder
  const { data: folderId, error: folderError } = useQuery({
    queryKey: ['chessFolder', user?.accessToken],
    queryFn: () => findChessFolder(user!.accessToken),
    enabled: !!user?.accessToken,
  });

  // Fetch chess.md content
  const { data: chessContent, isLoading, error: chessError } = useQuery({
    queryKey: ['chessFile', user?.accessToken, folderId],
    queryFn: () => readChessFile(user!.accessToken, folderId!, 'chess.md'),
    enabled: !!user?.accessToken && !!folderId,
  });

  const hasError = folderError || chessError;

  if (hasError) {
    return (
      <div className="py-4">
        <div className="card bg-red-50 border border-red-200">
          <h3 className="font-semibold text-red-900 mb-2">Error Loading Data</h3>
          <p className="text-sm text-red-700">
            {(folderError as Error)?.message || (chessError as Error)?.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-6">
      {/* Chess Overview */}
      <div className="card">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ) : chessContent ? (
          <MarkdownViewer content={chessContent} />
        ) : (
          <p className="text-gray-500">No content found</p>
        )}
      </div>

      {/* Debug info */}
      {user && (
        <div className="text-xs text-gray-400 text-center space-y-1">
          <p>Signed in as {user.email}</p>
          <p>Folder: {folderId ?? 'not found'} | Content: {chessContent ? `${chessContent.length} chars` : 'none'}</p>
        </div>
      )}
    </div>
  );
}
