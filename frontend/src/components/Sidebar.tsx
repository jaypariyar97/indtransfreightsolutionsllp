import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, Building2, Warehouse, Truck, Users,
  ClipboardList, FileText, GalleryVertical, UserCog,
  LogOut, KeyRound, MapPin,
} from 'lucide-react';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  prefetch: () => Promise<unknown>;
  /** Module this menu item belongs to in the permission system. Items without
   *  a module are visible to every authenticated user. */
  module?: string;
  /** Always admin-only (e.g. user management). */
  adminOnly?: boolean;
}

const MENU: MenuItem[] = [
  { label: 'Dashboard',       path: '/dashboard',          icon: LayoutDashboard,  prefetch: () => import('../pages/Dashboard') },
  { label: 'Customers',       path: '/admin/customers',    icon: Building2,        prefetch: () => import('../pages/Customers'),         module: 'customers' },
  { label: 'Transporters',    path: '/admin/transporters', icon: Warehouse,        prefetch: () => import('../pages/Transporters'),      module: 'transporters' },
  { label: 'Vehicles',        path: '/admin/vehicles',     icon: Truck,            prefetch: () => import('../pages/Vehicles'),          module: 'vehicles' },
  { label: 'Drivers',         path: '/admin/drivers',      icon: Users,            prefetch: () => import('../pages/Drivers'),           module: 'drivers' },
  { label: 'Vehicle Hire',    path: '/admin/vhc',          icon: ClipboardList,    prefetch: () => import('../pages/VHC'),               module: 'vhc' },
  { label: 'GCN Preparation', path: '/admin/gcn',          icon: FileText,         prefetch: () => import('../pages/GCN'),               module: 'gcn' },
  { label: 'View GCN',        path: '/admin/view-gcn',     icon: FileText,         prefetch: () => import('../pages/ViewGCN'),           module: 'gcn' },
  { label: 'Tracking',        path: '/admin/tracking',     icon: MapPin,           prefetch: () => import('../pages/Tracking'),          module: 'tracking' },
  { label: 'Billing',         path: '/admin/billing',      icon: FileText,         prefetch: () => import('../pages/Billing'),           module: 'billing' },
  { label: 'Gallery',         path: '/admin/gallery',      icon: GalleryVertical,  prefetch: () => import('../pages/GalleryManagement'), module: 'gallery' },
  { label: 'Users',           path: '/admin/users',        icon: UserCog,          prefetch: () => import('../pages/UserManagement'),    adminOnly: true },
];

const warmed = new Set<string>();
function warm(item: MenuItem) {
  if (warmed.has(item.path)) return;
  warmed.add(item.path);
  item.prefetch().catch(() => warmed.delete(item.path));
}

/**
 * Shared left sidebar used on every protected page. The menu is filtered down
 * to items the current user can actually view (admins see everything).
 */
export default function Sidebar() {
  const { user, logout, hasAnyPermission } = useAuth();
  const navigate = useNavigate();

  const visible = MENU.filter(m => {
    if (m.adminOnly) return user?.role === 'ADMIN';
    if (!m.module) return true; // shared (dashboard, change-password, etc.)
    if (user?.role === 'ADMIN') return true;
    return hasAnyPermission(m.module);
  });

  const handleLogout = () => {
    if (window.confirm('Sign out of the portal?')) {
      logout();
    }
  };

  return (
    <aside
      className="w-64 bg-white shadow-lg border-r border-gray-200 fixed h-full overflow-y-auto flex flex-col"
      data-testid="sidebar"
    >
      <div className="p-5 border-b border-gray-200 bg-gradient-to-br from-orange-50 to-white">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 w-full text-left"
          title="Go to dashboard"
        >
          <img src="/logo.jpeg" alt="INDTRANS" className="h-11 w-auto" />
          <div className="leading-none flex-1">
            <h1 className="text-[11px] font-black text-gray-900 tracking-wider uppercase leading-tight">
              INDTRANS FREIGHT<br />
              SOLUTIONS LLP
              {/* <span className="text-orange-600">LLP</span> */}
            </h1>
          </div>
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {visible.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              onMouseEnter={() => warm(item)}
              onFocus={() => warm(item)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-orange-50 hover:text-orange-700'
                }`
              }
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        {visible.length <= 1 && user?.role !== 'ADMIN' && (
          <div className="mt-4 px-3 py-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            Your account has no module access yet. Please contact an administrator
            to grant permissions.
          </div>
        )}
      </nav>

      <div className="border-t border-gray-200 p-3 bg-gray-50">
        {user && (
          <div className="px-3 py-2 mb-2 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Signed in as</p>
            <p className="text-sm font-semibold text-gray-800 truncate" title={user.email || user.username}>
              {user.email || user.username}
            </p>
            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mt-0.5">
              {user.role}
            </p>
          </div>
        )}
        <NavLink
          to="/admin/change-password"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium mb-1 ${
              isActive
                ? 'bg-orange-100 text-orange-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`
          }
          data-testid="nav-change-password"
        >
          <KeyRound className="w-4 h-4" />
          Change password
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50"
          data-testid="nav-logout"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
