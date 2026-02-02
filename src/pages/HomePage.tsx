import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import {
  getRootFolderId,
  getRootFolderName,
  listFolderContents,
  readFile,
} from '../services/googleDrive';
import { MarkdownViewer } from '../components/ui/MarkdownViewer';
import { FolderNav } from '../components/ui/FolderNav';

export function HomePage() {
  const { user } = useAuth();
  const rootFolderId = getRootFolderId();
  const rootFolderName = getRootFolderName();

  const { data: contents, isLoading } = useQuery({
    queryKey: ['rootContents', user?.accessToken, rootFolderId],
    queryFn: () => listFolderContents(user!.accessToken, rootFolderId!),
    enabled: !!user?.accessToken && !!rootFolderId,
  });

  const isSingleFile = contents?.files.length === 1;
  const singleFile = isSingleFile ? contents.files[0] : null;
  const indexFile = !isSingleFile ? contents?.files.find(f =>
    f.name.toLowerCase() === 'index.md' || f.name.toLowerCase() === 'readme.md'
  ) : null;
  const fileToShow = singleFile || indexFile;

  const { data: fileContent } = useQuery({
    queryKey: ['fileContent', fileToShow?.id, user?.accessToken],
    queryFn: () => readFile(user!.accessToken, fileToShow!.id),
    enabled: !!user?.accessToken && !!fileToShow?.id,
  });

  if (!rootFolderId) {
    return (
      <div className="py-6 lg:py-10">
        <div className="card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[var(--color-bg-subtle)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Select a Root Folder
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-6 max-w-sm mx-auto">
            Choose a Google Drive folder to browse your markdown files.
          </p>
          <Link to="/settings" className="btn-primary inline-block">
            Open Settings
          </Link>
        </div>
      </div>
    );
  }

  const otherFiles = contents?.files.filter(f =>
    f.name.toLowerCase() !== 'index.md' && f.name.toLowerCase() !== 'readme.md'
  ) || [];

  return (
    <div className="py-6 lg:py-10 space-y-8">
      {/* Header - hidden on desktop since sidebar shows workspace */}
      <div className="lg:hidden">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
          Workspace
        </p>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
          {rootFolderName}
        </h1>
      </div>

      {/* Desktop header */}
      <div className="hidden lg:block">
        <h1 className="text-3xl font-semibold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
          Welcome
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Browse your markdown files from {rootFolderName}
        </p>
      </div>

      {isLoading ? (
        <div className="card animate-pulse space-y-4">
          <div className="h-6 bg-[var(--color-bg-subtle)] rounded w-1/2"></div>
          <div className="h-4 bg-[var(--color-bg-subtle)] rounded w-3/4"></div>
          <div className="h-4 bg-[var(--color-bg-subtle)] rounded w-2/3"></div>
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
          {fileContent && (
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
                {contents.folders.map((folder) => (
                  <Link
                    key={folder.id}
                    to={`/folder/${folder.id}`}
                    className="card card-hover flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-subtle)] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <span className="font-medium text-[var(--color-text)] truncate">{folder.name}</span>
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
