import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { findChessFolder, readChessFile, type ChessFileName } from '../services/googleDrive';
import { MarkdownViewer } from '../components/ui/MarkdownViewer';

export function FilePage() {
  const { filename } = useParams<{ filename: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const fullFilename = `${filename}.md` as ChessFileName;

  const { data: folderId } = useQuery({
    queryKey: ['chessFolder', user?.accessToken],
    queryFn: () => findChessFolder(user!.accessToken),
    enabled: !!user?.accessToken,
  });

  const { data: content, isLoading, error } = useQuery({
    queryKey: ['file', fullFilename, user?.accessToken, folderId],
    queryFn: () => readChessFile(user!.accessToken, folderId!, fullFilename),
    enabled: !!user?.accessToken && !!folderId && !!filename,
  });

  if (error) {
    return (
      <div className="py-4">
        <div className="card bg-red-50 border border-red-200">
          <h3 className="font-semibold text-red-900 mb-2">File Not Found</h3>
          <p className="text-sm text-red-700 mb-3">
            Could not load {fullFilename}
          </p>
          <button
            onClick={() => navigate('/more')}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Files
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <button
        onClick={() => navigate('/more')}
        className="text-sm text-blue-600 hover:underline mb-4 block"
      >
        ← Back to Files
      </button>

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
