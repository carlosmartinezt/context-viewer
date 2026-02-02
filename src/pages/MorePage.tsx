import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { listFolders, getRootFolderId, getRootFolderName } from '../services/googleDrive';

const MAX_NAV_ITEMS = 4;

export function MorePage() {
  const { user } = useAuth();
  const rootFolderId = getRootFolderId();
  const rootFolderName = getRootFolderName();

  const { data: folders, isLoading } = useQuery({
    queryKey: ['rootFolders', user?.accessToken, rootFolderId],
    queryFn: () => listFolders(user!.accessToken, rootFolderId!),
    enabled: !!user?.accessToken && !!rootFolderId,
  });

  const additionalFolders = (folders || []).slice(MAX_NAV_ITEMS);

  return (
    <div className="py-6 lg:py-10 space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-[var(--color-text)]" style={{ fontFamily: 'var(--font-display)' }}>
          More
        </h1>
        {rootFolderName && (
          <p className="text-[var(--color-text-secondary)] mt-1">
            Browsing {rootFolderName}
          </p>
        )}
      </div>

      {/* Additional Folders (not in nav) */}
      {additionalFolders.length > 0 && (
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
            More Folders
          </h3>
          <div className="space-y-2">
            {isLoading ? (
              <div className="card animate-pulse">
                <div className="h-4 bg-[var(--color-bg-subtle)] rounded w-1/2"></div>
              </div>
            ) : (
              additionalFolders.map((folder) => (
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
                  <span className="font-medium text-[var(--color-text)] flex-1">{folder.name}</span>
                  <svg className="w-4 h-4 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))
            )}
          </div>
        </section>
      )}

      {/* All folders quick access */}
      {folders && folders.length > 0 && (
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
            All Folders
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {folders.map((folder) => (
              <Link
                key={folder.id}
                to={`/folder/${folder.id}`}
                className="card card-hover flex items-center gap-3 py-3"
              >
                <svg className="w-4 h-4 text-[var(--color-accent)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-sm font-medium text-[var(--color-text)] truncate">
                  {folder.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Settings Link */}
      <section>
        <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
          Settings
        </h3>
        <Link
          to="/settings"
          className="card card-hover flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-subtle)] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-medium text-[var(--color-text)]">Settings</div>
            <div className="text-sm text-[var(--color-text-tertiary)]">Root folder, account, sign out</div>
          </div>
          <svg className="w-4 h-4 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>
    </div>
  );
}
