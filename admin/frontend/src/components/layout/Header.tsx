import { useAuth } from '@/context/AuthContext';
import { Bell, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';

export const Header = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Get current section title from pathname
  const pathParts = pathname.split('/').filter(Boolean);
  const currentSection = pathParts.length > 1 
    ? pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1) 
    : 'Dashboard';

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-bold tracking-tight text-[var(--color-primary)]">AWIS</h1>
        <div className="h-6 w-px bg-gray-200"></div>
        <h2 className="text-sm font-semibold text-gray-900">{currentSection}</h2>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-gray-400 hover:text-gray-600 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-[var(--color-primary)] rounded-full border border-white"></span>
        </button>

        <div className="flex items-center gap-3 border-l border-gray-100 pl-6">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 leading-none">{user?.fullName || 'User'}</p>
            <p className="text-xs text-gray-500 mt-1">{user?.position || 'Admin'}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gray-100 text-[var(--color-primary)] flex items-center justify-center font-bold text-sm shadow-sm border border-gray-200">
            {user?.fullName?.charAt(0) || 'A'}
          </div>
        </div>

        <button 
          onClick={logout}
          className="ml-2 text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
          title="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};
