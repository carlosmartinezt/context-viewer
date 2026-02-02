import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { readFile } from '../services/googleDrive';
import { MarkdownViewer } from '../components/ui/MarkdownViewer';

export function FilePage() {
  const { fileId } = useParams<{ fileId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: content, isLoading, error } = useQuery({
    queryKey: ['file', fileId, user?.accessToken],
    queryFn: () => readFile(user!.accessToken, fileId!),
    enabled: !!user?.accessToken && !!fileId,
  });

  if (error) {
    return (
      <div className="py-6 lg:py-10">
        <div className="card border-l-4 border-l-red-400">
          <h3 className="font-semibold text-[var(--color-text)] mb-2">File Not Found</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Could not load this file. It may have been moved or deleted.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 lg:py-10 space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="card">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-[var(--color-bg-subtle)] rounded w-1/2"></div>
            <div className="h-4 bg-[var(--color-bg-subtle)] rounded w-3/4"></div>
            <div className="h-4 bg-[var(--color-bg-subtle)] rounded w-2/3"></div>
          </div>
        ) : content ? (
          <MarkdownViewer content={content} />
        ) : (
          <p className="text-[var(--color-text-secondary)]">No content found</p>
        )}
      </div>
    </div>
  );
}
