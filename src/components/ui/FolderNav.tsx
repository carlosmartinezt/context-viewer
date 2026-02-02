import { useState } from 'react';
import { Link } from 'react-router-dom';

interface FolderItem {
  id: string;
  name: string;
}

interface FolderNavProps {
  folders: FolderItem[];
  files: FolderItem[];
}

export function FolderNav({ folders, files }: FolderNavProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Hide if nothing to navigate to
  if (folders.length === 0 && files.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile: Collapsible */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-label="Toggle folder navigation"
          className="w-full card flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-subtle)] flex items-center justify-center">
              <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <span className="text-sm text-[var(--color-text-secondary)]">
              {folders.length > 0 && `${folders.length} folder${folders.length !== 1 ? 's' : ''}`}
              {folders.length > 0 && files.length > 0 && ', '}
              {files.length > 0 && `${files.length} file${files.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-2">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                to={`/folder/${folder.id}`}
                className="card card-hover flex items-center gap-3 py-3"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-subtle)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <span className="font-medium text-[var(--color-text)] truncate text-sm">{folder.name}</span>
                <svg className="w-4 h-4 text-[var(--color-text-tertiary)] ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
            {files.map((file) => (
              <Link
                key={file.id}
                to={`/file/${file.id}`}
                className="card card-hover flex items-center gap-3 py-3"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-subtle)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="font-medium text-[var(--color-text)] truncate text-sm">{file.name.endsWith('.md') ? file.name.slice(0, -3) : file.name}</span>
                <svg className="w-4 h-4 text-[var(--color-text-tertiary)] ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Always visible, compact */}
      <div className="hidden lg:block">
        <div className="flex flex-wrap gap-2">
          {folders.map((folder) => (
            <Link
              key={folder.id}
              to={`/folder/${folder.id}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-subtle)] hover:bg-[var(--color-border-subtle)] text-sm text-[var(--color-text)] transition-colors"
            >
              <svg className="w-4 h-4 text-[var(--color-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              {folder.name}
            </Link>
          ))}
          {files.map((file) => (
            <Link
              key={file.id}
              to={`/file/${file.id}`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-bg-subtle)] hover:bg-[var(--color-border-subtle)] text-sm text-[var(--color-text)] transition-colors"
            >
              <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {file.name.endsWith('.md') ? file.name.slice(0, -3) : file.name}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
