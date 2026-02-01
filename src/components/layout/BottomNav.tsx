import { NavLink, useLocation } from 'react-router-dom';

interface NavItem {
  to: string;
  icon: string;
  label: string;
  matchPaths?: string[]; // Additional paths that should highlight this item
}

const navItems: NavItem[] = [
  { to: '/', icon: '📅', label: 'Home' },
  { to: '/coaches', icon: '🎓', label: 'Coaches' },
  { to: '/tournaments', icon: '🏆', label: 'Tournaments' },
  { to: '/curriculum', icon: '📚', label: 'Curriculum' },
  { to: '/more', icon: '☰', label: 'More', matchPaths: ['/settings', '/file'] },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          // Check if this item should be active
          const isExactMatch = location.pathname === item.to;
          const isPathMatch = item.matchPaths?.some((p) =>
            location.pathname.startsWith(p)
          );
          const isActive = isExactMatch || isPathMatch;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
