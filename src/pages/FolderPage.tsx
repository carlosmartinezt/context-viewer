import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { listFolderContents, getFolder, readFile } from '../services/googleDrive';
import { MarkdownViewer } from '../components/ui/MarkdownViewer';
import { FolderNav } from '../components/ui/FolderNav';

export function FolderPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: folder } = useQuery({
    queryKey: ['folder', folderId, user?.accessToken],
    queryFn: () => getFolder(user!.accessToken, folderId!),
    enabled: !!user?.accessToken && !!folderId,
  });

  const { data: contents, isLoading } = useQuery({
    queryKey: ['folderContents', folderId, user?.accessToken],
    queryFn: () => listFolderContents(user!.accessToken, folderId!),
    enabled: !!user?.accessToken && !!folderId,
  });

  const isSingleFile = contents?.files.length === 1;

  const singleFile = isSingleFile ? contents.files[0] : null;

  const indexFile = !isSingleFile ? contents?.files.find(f =>
    f.name.toLowerCase() === 'index.md' || f.name.toLowerCase() === 'readme.md'
  ) : null;

  const fileToRead = singleFile || indexFile;
  const { data: fileContent } = useQuery({
    queryKey: ['fileContent', fileToRead?.id, user?.accessToken],
    queryFn: () => readFile(user!.accessToken, fileToRead!.id),
    enabled: !!user?.accessToken && !!fileToRead?.id,
  });

  const otherFiles = contents?.files.filter(f =>
    f.name.toLowerCase() !== 'index.md' && f.name.toLowerCase() !== 'readme.md'
  ) || [];

  return (
    <div className="py-6 lg:py-10 space-y-6">
      {/* Folder header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-lg bg-[var(--color-bg-subtle)] flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-border-subtle)] hover:text-[var(--color-text)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl lg:text-3xl font-semibold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
          {folder?.name || 'Loading...'}
        </h1>
      </div>

      {isLoading ? (
        <div className="card animate-pulse space-y-4">
          <div className="h-4 bg-[var(--color-bg-subtle)] rounded w-1/2"></div>
          <div className="h-4 bg-[var(--color-bg-subtle)] rounded w-3/4"></div>
        </div>
      ) : isSingleFile && fileContent ? (
        <div className="space-y-4">
          <FolderNav folders={contents?.folders || []} files={contents?.files || []} />
          <div className="card">
            <MarkdownViewer content={fileContent} files={contents?.files || []} />
          </div>
        </div>
      ) : (
        <>
          {fileContent && indexFile && (
            <div className="card">
              <MarkdownViewer content={fileContent} files={contents?.files || []} />
            </div>
          )}

          {contents?.folders && contents.folders.length > 0 && (
            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
                Folders
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {contents.folders.map((subfolder) => (
                  <Link
                    key={subfolder.id}
                    to={`/folder/${subfolder.id}`}
                    className="card card-hover flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-subtle)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <span className="font-medium text-[var(--color-text)] truncate">{subfolder.name}</span>
                    <svg className="w-4 h-4 text-[var(--color-text-tertiary)] ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {otherFiles.length > 0 && (
            <section>
              <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
                Files
              </h3>
              <div className="space-y-2">
                {otherFiles.map((file) => (
                  <Link
                    key={file.id}
                    to={`/file/${file.id}`}
                    className="card card-hover flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-subtle)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[var(--color-text)] truncate">
                        {file.name.replace('.md', '')}
                      </div>
                      <div className="text-xs text-[var(--color-text-tertiary)]">{file.name}</div>
                    </div>
                    <svg className="w-4 h-4 text-[var(--color-text-tertiary)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {(!contents?.folders?.length && !contents?.files?.length) && (
            <div className="card text-[var(--color-text-secondary)] text-center py-12">
              <p>This folder is empty</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
