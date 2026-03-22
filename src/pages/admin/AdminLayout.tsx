import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Grid3X3, UtensilsCrossed, ClipboardList, Users, BarChart3, ArrowLeft } from 'lucide-react';
import logo from '@/assets/restaurant-logo.png';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/mesas', icon: Grid3X3, label: 'Mesas' },
  { to: '/admin/menu', icon: UtensilsCrossed, label: 'Menú' },
  { to: '/admin/pedidos', icon: ClipboardList, label: 'Pedidos' },
  { to: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/admin/reportes', icon: BarChart3, label: 'Reportes' },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
          <img src={logo} alt="Mesa Viva" className="w-9 h-9 rounded-xl" />
          <div>
            <h2 className="font-display text-base text-sidebar-foreground">Mesa Viva</h2>
            <p className="text-[10px] text-sidebar-foreground/50">Panel de administración</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
