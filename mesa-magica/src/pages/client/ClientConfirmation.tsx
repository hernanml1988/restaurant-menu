import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, MapPin } from 'lucide-react';
import { RESTAURANT } from '@/data/mockData';
import { useApp } from '@/context/AppContext';

export default function ClientConfirmation() {
  const navigate = useNavigate();
  const { orderNumber } = useApp();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <div className="animate-scale-in w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-accent" />
      </div>

      <h1 className="font-display text-2xl mb-2 animate-slide-up">¡Pedido enviado!</h1>
      <p className="text-muted-foreground text-sm mb-8 animate-slide-up delay-100">
        Tu pedido fue recibido y la cocina ya está trabajando en él.
      </p>

      <div className="w-full max-w-xs space-y-3 animate-slide-up delay-200">
        <div className="bg-card border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            #{orderNumber}
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Número de pedido</p>
            <p className="font-semibold">Pedido #{orderNumber}</p>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-accent" />
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Mesa asignada</p>
            <p className="font-semibold">{RESTAURANT.currentTable}</p>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-status-preparing/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-status-preparing" />
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Tiempo estimado</p>
            <p className="font-semibold">15 - 25 min</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/cliente/seguimiento')}
        className="mt-8 bg-primary text-primary-foreground font-medium px-8 py-3.5 rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.97] transition-transform animate-slide-up delay-300"
      >
        Seguir mi pedido
      </button>

      <button
        onClick={() => navigate('/cliente/menu')}
        className="mt-3 text-sm text-muted-foreground underline underline-offset-4 animate-slide-up delay-400"
      >
        Volver al menú
      </button>
    </div>
  );
}
