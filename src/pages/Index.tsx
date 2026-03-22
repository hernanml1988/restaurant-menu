import { useNavigate } from 'react-router-dom';
import { Smartphone, ChefHat, Settings } from 'lucide-react';
import logo from '@/assets/restaurant-logo.png';

const views = [
  {
    title: 'Cliente',
    description: 'Experiencia móvil del comensal. Escaneo QR, menú, pedidos y seguimiento.',
    icon: Smartphone,
    path: '/cliente/bienvenida',
    color: 'bg-primary/10 text-primary',
    border: 'hover:border-primary/40',
  },
  {
    title: 'Cocina',
    description: 'Panel de pedidos en tiempo real. Vista kanban para gestión de preparación.',
    icon: ChefHat,
    path: '/cocina',
    color: 'bg-accent/10 text-accent',
    border: 'hover:border-accent/40',
  },
  {
    title: 'Administración',
    description: 'Dashboard, mesas, menú, usuarios, reportes y configuración general.',
    icon: Settings,
    path: '/admin',
    color: 'bg-secondary-foreground/10 text-secondary-foreground',
    border: 'hover:border-secondary-foreground/40',
  },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="animate-slide-up max-w-2xl w-full text-center">
        <img src={logo} alt="Mesa Viva" className="w-20 h-20 mx-auto mb-4 rounded-2xl" />
        <h1 className="font-display text-4xl md:text-5xl tracking-tight mb-2">Mesa Viva</h1>
        <p className="text-muted-foreground text-lg mb-12">Sabores que conectan — Prototipo interactivo</p>

        <div className="grid gap-4 md:grid-cols-3">
          {views.map((v, i) => (
            <button
              key={v.title}
              onClick={() => navigate(v.path)}
              className={`group relative text-left rounded-2xl border-2 border-border bg-card p-6 transition-all duration-300 hover:shadow-lg active:scale-[0.97] ${v.border} animate-slide-up`}
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${v.color}`}>
                <v.icon className="w-6 h-6" />
              </div>
              <h2 className="font-semibold text-lg mb-1">{v.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-12 opacity-60">
          Demo funcional — Datos simulados — Sin backend real
        </p>
      </div>
    </div>
  );
}
