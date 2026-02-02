import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { listFolders, getRootFolderId, getRootFolderName } from '../../services/googleDrive';

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const rootFolderId = getRootFolderId();
  const rootFolderName = getRootFolderName();

  const { data: folders } = useQuery({
    queryKey: ['rootFolders', user?.accessToken, rootFolderId],
    queryFn: () => listFolders(user!.accessToken, rootFolderId!),
    enabled: !!user?.accessToken && !!rootFolderId,
  });

  const navLinkClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[0.9375rem] transition-all ${
      isActive
        ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] font-medium'
        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text)]'
    }`;

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 w-64 border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
      {/* Root folder label */}
      {rootFolderName && (
        <div className="px-5 py-4 border-b border-[var(--color-border-subtle)]">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Workspace
          </p>
          <p className="text-sm font-medium text-[var(--color-text)] mt-0.5 truncate">
            {rootFolderName}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        <NavLink
          to="/"
          className={({ isActive }) => navLinkClass(isActive && location.pathname === '/')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Home</span>
        </NavLink>

        {/* Folder divider */}
        {folders && folders.length > 0 && (
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Folders
            </p>
          </div>
        )}

        {/* Folders */}
        {folders?.map((folder) => {
          const isActive = location.pathname === `/folder/${folder.id}`;
          return (
            <NavLink
              key={folder.id}
              to={`/folder/${folder.id}`}
              className={() => navLinkClass(isActive)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="truncate">{folder.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-[var(--color-border-subtle)] space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) => navLinkClass(isActive)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
