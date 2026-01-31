import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/', icon: '📅', label: 'Home' },
  { to: '/coaches', icon: '🎓', label: 'Coaches' },
  { to: '/tournaments', icon: '🏆', label: 'Tourneys' },
  { to: '/curriculum', icon: '📚', label: 'Learn' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            <span className="text-xl mb-0.5">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
