import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { listFolders, getRootFolderId } from '../../services/googleDrive';

const MAX_NAV_ITEMS = 4;

interface NavItem {
  to: string;
  label: string;
  folderId?: string;
  matchPaths?: string[];
  icon: React.ReactNode;
}

// Icons as components
const HomeIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const MoreIcon = () => (
  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const rootFolderId = getRootFolderId();

  const { data: folders } = useQuery({
    queryKey: ['rootFolders', user?.accessToken, rootFolderId],
    queryFn: () => listFolders(user!.accessToken, rootFolderId!),
    enabled: !!user?.accessToken && !!rootFolderId,
  });

  const folderNavItems: NavItem[] = (folders || []).slice(0, MAX_NAV_ITEMS).map((folder) => ({
    to: `/folder/${folder.id}`,
    icon: <FolderIcon />,
    label: folder.name.length > 8 ? folder.name.slice(0, 7) + '…' : folder.name,
    folderId: folder.id,
  }));

  const navItems: NavItem[] = [
    { to: '/', icon: <HomeIcon />, label: 'Home' },
    ...folderNavItems,
    { to: '/more', icon: <MoreIcon />, label: 'More', matchPaths: ['/settings', '/file'] },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-bg-elevated)] border-t border-[var(--color-border-subtle)] safe-area-bottom z-20">
      <div className="flex justify-around items-center h-[var(--nav-height)]">
        {navItems.map((item) => {
          const isExactMatch = location.pathname === item.to;
          const isPathMatch = item.matchPaths?.some((p) =>
            location.pathname.startsWith(p)
          );
          const isFolderMatch = item.folderId && location.pathname === `/folder/${item.folderId}`;
          const isUnlistedFolder = item.to === '/more' &&
            location.pathname.startsWith('/folder/') &&
            !folderNavItems.some(f => location.pathname === f.to);

          const isActive = isExactMatch || isPathMatch || isFolderMatch || isUnlistedFolder;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-tertiary)] active:text-[var(--color-text-secondary)]'
              }`}
            >
              <div className={`mb-1 ${isActive ? 'scale-105' : ''} transition-transform`}>
                {item.icon}
              </div>
              <span className={`text-[0.6875rem] ${isActive ? 'font-medium' : ''}`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
