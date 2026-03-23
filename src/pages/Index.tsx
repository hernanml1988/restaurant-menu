import { useNavigate } from 'react-router-dom';
import { Smartphone, ChefHat, Settings, LockKeyhole } from 'lucide-react';
import logo from '@/assets/restaurant-logo.png';
import { useRestaurantProfile } from '@/hooks/use-restaurant-profile';

const views = [
  {
    title: 'Cliente',
    description:
      'Experiencia movil del comensal. Escaneo QR, menu, pedidos y seguimiento.',
    icon: Smartphone,
    path: '/cliente/bienvenida',
    color: 'bg-primary/10 text-primary',
    border: 'hover:border-primary/40',
  },
  {
    title: 'Cocina',
    description:
      'Panel de pedidos en tiempo real. Vista kanban para gestion de preparacion.',
    icon: ChefHat,
    path: '/cocina',
    color: 'bg-accent/10 text-accent',
    border: 'hover:border-accent/40',
    protected: true,
  },
  {
    title: 'Administracion',
    description:
      'Dashboard, mesas, menu, usuarios, reportes y configuracion general.',
    icon: Settings,
    path: '/admin',
    color: 'bg-secondary-foreground/10 text-secondary-foreground',
    border: 'hover:border-secondary-foreground/40',
    protected: true,
  },
];

export default function Index() {
  const navigate = useNavigate();
  const { profile } = useRestaurantProfile();
  const brandLogo = profile.logoDataUrl || logo;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="animate-slide-up max-w-2xl w-full text-center">
        <img
          src={brandLogo}
          alt={profile.name}
          className="w-20 h-20 mx-auto mb-4 rounded-2xl object-cover"
        />
        <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-2">
          {profile.name}
        </h1>
        <p className="text-muted-foreground text-lg mb-12">
          {profile.tagline} - Prototipo interactivo
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          {views.map((view, index) => (
            <button
              key={view.title}
              onClick={() => navigate(view.path)}
              className={`group relative text-left rounded-2xl border-2 border-border bg-card p-6 transition-all duration-300 hover:shadow-lg active:scale-[0.97] ${view.border} animate-slide-up`}
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${view.color}`}
              >
                <view.icon className="w-6 h-6" />
              </div>
              <h2 className="font-semibold text-lg mb-1">{view.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {view.description}
              </p>
              {view.protected ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  Requiere login
                </div>
              ) : null}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-12 opacity-60">
          Demo funcional - Datos simulados - Sin backend real
        </p>
      </div>
    </div>
  );
}
