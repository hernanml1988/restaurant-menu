import { useNavigate } from 'react-router-dom';
import { MapPin, Bell, Receipt, ArrowRight } from 'lucide-react';
import { RESTAURANT } from '@/data/mockData';
import logo from '@/assets/restaurant-logo.png';

export default function ClientWelcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="animate-scale-in mb-6">
        <img src={logo} alt={RESTAURANT.name} className="w-24 h-24 mx-auto rounded-3xl shadow-lg" />
      </div>

      <h1 className="font-display text-3xl tracking-tight mb-1 animate-slide-up">
        {RESTAURANT.name}
      </h1>
      <p className="text-muted-foreground mb-6 animate-slide-up delay-100">{RESTAURANT.tagline}</p>

      <div className="animate-slide-up delay-200 bg-primary/8 border border-primary/20 rounded-2xl px-6 py-4 mb-8 flex items-center gap-3">
        <MapPin className="w-5 h-5 text-primary shrink-0" />
        <div className="text-left">
          <p className="text-xs text-muted-foreground">Estás en</p>
          <p className="font-semibold text-lg">{RESTAURANT.currentTable}</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-8 max-w-xs animate-slide-up delay-300">
        Bienvenido a tu experiencia gastronómica. Explora nuestro menú, personaliza tu pedido y nosotros nos encargamos del resto.
      </p>

      <button
        onClick={() => navigate('/cliente/menu')}
        className="animate-slide-up delay-400 w-full max-w-xs bg-primary text-primary-foreground font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.97]"
      >
        Ver menú
        <ArrowRight className="w-5 h-5" />
      </button>

      <div className="flex gap-3 mt-6 animate-slide-up delay-500">
        <button
          onClick={() => navigate('/cliente/ayuda')}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border bg-card text-sm font-medium hover:bg-muted transition-colors active:scale-[0.97]"
        >
          <Bell className="w-4 h-4" />
          Llamar mesero
        </button>
        <button
          onClick={() => navigate('/cliente/ayuda')}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border bg-card text-sm font-medium hover:bg-muted transition-colors active:scale-[0.97]"
        >
          <Receipt className="w-4 h-4" />
          Pedir cuenta
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground/50 mt-12">
        Sesión: {RESTAURANT.sessionToken} · Expira al cerrar cuenta
      </p>
    </div>
  );
}
