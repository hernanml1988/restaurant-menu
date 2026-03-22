import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { UtensilsCrossed, ShoppingCart, ClipboardList, Bell } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const tabs = [
  { icon: UtensilsCrossed, label: 'Menú', path: '/cliente/menu' },
  { icon: ShoppingCart, label: 'Carrito', path: '/cliente/carrito' },
  { icon: ClipboardList, label: 'Pedidos', path: '/cliente/seguimiento' },
  { icon: Bell, label: 'Ayuda', path: '/cliente/ayuda' },
];

export default function ClientLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount } = useApp();

  const isWelcome = location.pathname === '/cliente/bienvenida';

  return (
    <div className="client-shell relative flex flex-col min-h-screen">
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>

      {!isWelcome && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-md border-t z-50">
          <div className="flex items-center justify-around h-16 px-2">
            {tabs.map(tab => {
              const active = location.pathname.startsWith(tab.path);
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors relative ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                  {tab.label === 'Carrito' && cartCount > 0 && (
                    <span className="absolute -top-1 right-0 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
