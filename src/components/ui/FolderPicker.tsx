import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { listFolders, type DriveFolder } from '../../services/googleDrive';

interface FolderPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folder: DriveFolder) => void;
  accessToken: string | null;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

const ROOT: BreadcrumbItem = { id: 'root', name: 'My Drive' };

export function FolderPicker({ isOpen, onClose, onSelect, accessToken }: FolderPickerProps) {
  const [currentFolder, setCurrentFolder] = useState<BreadcrumbItem>(ROOT);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([ROOT]);

  const { data: folders, isLoading } = useQuery({
    queryKey: ['pickerFolders', currentFolder.id, accessToken],
    queryFn: () => listFolders(accessToken!, currentFolder.id),
    enabled: isOpen && !!accessToken,
  });

  // Reset to root on open
  useEffect(() => {
    if (isOpen) {
      setCurrentFolder(ROOT);
      setBreadcrumbs([ROOT]);
    }
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const navigateToFolder = useCallback((folder: DriveFolder) => {
    const item = { id: folder.id, name: folder.name };
    setBreadcrumbs(prev => [...prev, item]);
    setCurrentFolder(item);
  }, []);

  const navigateToBreadcrumb = useCallback((index: number) => {
    setBreadcrumbs(prev => prev.slice(0, index + 1));
    setCurrentFolder(breadcrumbs[index]);
  }, [breadcrumbs]);

  const handleSelect = useCallback(() => {
    onSelect({ id: currentFolder.id, name: currentFolder.name });
    onClose();
  }, [currentFolder, onSelect, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full h-full bg-[var(--color-bg)] flex flex-col lg:h-auto lg:max-h-[80vh] lg:max-w-lg lg:rounded-2xl lg:shadow-lg lg:border lg:border-[var(--color-border-subtle)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2
            className="text-lg font-semibold text-[var(--color-text)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Select Folder
          </h2>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>

        {/* Breadcrumbs */}
        <div className="px-4 py-2 border-b border-[var(--color-border-subtle)] overflow-x-auto">
          <div className="flex items-center gap-1 whitespace-nowrap text-sm">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.id + i} className="flex items-center gap-1">
                {i > 0 && (
                  <svg className="w-3 h-3 text-[var(--color-text-tertiary)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                <button
                  onClick={() => navigateToBreadcrumb(i)}
                  className={`hover:underline ${
                    i === breadcrumbs.length - 1
                      ? 'text-[var(--color-accent)] font-medium'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Folder list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-subtle)]" />
                  <div className="h-4 bg-[var(--color-bg-subtle)] rounded flex-1" />
                </div>
              ))}
            </div>
          ) : folders && folders.length > 0 ? (
            <div className="p-3 space-y-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => navigateToFolder(folder)}
                  className="w-full flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-[var(--color-bg-subtle)] transition-colors text-left"
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
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--color-text-secondary)]">
              <p>No subfolders</p>
            </div>
          )}
        </div>

        {/* Bottom action */}
        <div className="px-4 py-3 border-t border-[var(--color-border-subtle)] safe-area-bottom">
          <button
            onClick={handleSelect}
            className="w-full py-3 bg-[var(--color-accent)] text-white font-medium rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Select &ldquo;{currentFolder.name}&rdquo;
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
