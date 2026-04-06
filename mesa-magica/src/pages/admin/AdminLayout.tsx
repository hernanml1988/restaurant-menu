import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Grid3X3,
  UtensilsCrossed,
  ClipboardList,
  Users,
  BarChart3,
  CalendarDays,
  Wallet,
  ArrowLeft,
  Building2,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import logo from '@/assets/restaurant-logo.png';
import { useRestaurantProfile } from '@/hooks/use-restaurant-profile';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/mesas', icon: Grid3X3, label: 'Mesas' },
  { to: '/admin/menu', icon: UtensilsCrossed, label: 'Menu' },
  { to: '/admin/pedidos', icon: ClipboardList, label: 'Pedidos' },
  { to: '/admin/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/admin/reportes', icon: BarChart3, label: 'Reportes' },
  { to: '/admin/reservas', icon: CalendarDays, label: 'Reservas' },
  { to: '/admin/operaciones', icon: Wallet, label: 'Operaciones' },
  { to: '/admin/mis-datos', icon: Building2, label: 'Mis Datos' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { profile } = useRestaurantProfile();
  const { user, logout } = useAuth();
  const brandLogo = profile.logoDataUrl || logo;

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
          <img
            src={brandLogo}
            alt={profile.name}
            className="w-9 h-9 rounded-xl object-cover"
          />
          <div>
            <h2 className="font-display text-base text-sidebar-foreground">
              {profile.name}
            </h2>
            <p className="text-[10px] text-sidebar-foreground/50">
              Panel de administracion
            </p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
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

        <div className="p-3 space-y-3 border-t border-sidebar-border">
          {user ? (
            <div className="rounded-2xl bg-sidebar-accent px-4 py-3">
              <div className="flex items-center gap-2 text-sidebar-foreground">
                <ShieldCheck className="h-4 w-4 text-sidebar-primary" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                  Administracion
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-sidebar-foreground">
                {user.fullName}
              </p>
              <p className="text-xs text-sidebar-foreground/55">{user.email}</p>
            </div>
          ) : null}

          <button
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesion
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-8 max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
