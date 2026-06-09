import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Users, Briefcase, CheckSquare, Settings, ShoppingCart } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/AWIS/dashboard', icon: LayoutDashboard },
  { name: 'Products', href: '/AWIS/products', icon: Package },
  { name: 'Blueprint', href: '/AWIS/blueprint', icon: Package },
  { name: 'Clients', href: '/AWIS/clients', icon: Users },
  { name: 'Orders', href: '/AWIS/orders', icon: ShoppingCart },
  { name: 'Employees', href: '/AWIS/employees', icon: Briefcase },
  { name: 'Tasks', href: '/AWIS/tasks', icon: CheckSquare },
  { name: 'Settings', href: '/AWIS/settings', icon: Settings },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium
                ${isActive 
                  ? 'bg-[var(--color-primary)] text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
              {item.name}
            </Link>
          );
        })}
      </div>
    </aside>
  );
};
