import { useNavigate } from 'react-router-dom';
import { Check, Clock, ChefHat, Bell, Package } from 'lucide-react';
import { RESTAURANT } from '@/data/mockData';
import { useApp } from '@/context/AppContext';

const steps = [
  { id: 'received', label: 'Recibido', sublabel: 'Tu pedido fue registrado', icon: Check, time: '14:38' },
  { id: 'preparing', label: 'En preparación', sublabel: 'La cocina está trabajando en tu pedido', icon: ChefHat, time: '14:40' },
  { id: 'ready', label: 'Listo', sublabel: 'Tu pedido está listo para servir', icon: Package, time: '' },
  { id: 'delivered', label: 'Entregado', sublabel: '¡Buen provecho!', icon: Bell, time: '' },
];

const currentStep = 1; // 0-indexed, "preparing"

export default function ClientTracking() {
  const navigate = useNavigate();
  const { orderNumber } = useApp();

  return (
    <div className="px-5 pt-5 animate-fade-in">
      <h1 className="font-display text-2xl mb-1">Seguimiento</h1>
      <p className="text-sm text-muted-foreground mb-6">{RESTAURANT.currentTable} · Pedido #{orderNumber}</p>

      {/* Estimated time */}
      <div className="bg-primary/8 border border-primary/15 rounded-2xl p-5 mb-8 text-center">
        <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
        <p className="text-xs text-muted-foreground mb-1">Tiempo estimado de entrega</p>
        <p className="font-display text-3xl text-primary">~18 min</p>
        <div className="w-full bg-primary/15 rounded-full h-2 mt-3 overflow-hidden">
          <div className="bg-primary h-full rounded-full" style={{ width: '40%', animation: 'progress-bar 2s ease-out both' }} />
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-8 space-y-0">
        {steps.map((step, i) => {
          const done = i <= currentStep;
          const active = i === currentStep;
          return (
            <div key={step.id} className="relative pb-8 last:pb-0 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              {/* Line */}
              {i < steps.length - 1 && (
                <div className={`absolute left-[-20px] top-8 w-0.5 h-full ${done ? 'bg-primary' : 'bg-border'}`} />
              )}
              {/* Dot */}
              <div className={`absolute left-[-28px] top-1 w-5 h-5 rounded-full flex items-center justify-center ${
                done ? 'bg-primary text-primary-foreground' : 'bg-muted border-2 border-border'
              } ${active ? 'ring-4 ring-primary/20' : ''}`}>
                {done && <Check className="w-3 h-3" />}
              </div>
              {/* Content */}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold text-sm ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</h3>
                  {active && (
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse-soft">
                      En curso
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.sublabel}</p>
                {step.time && <p className="text-[10px] text-muted-foreground/60 mt-1">{step.time}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Past orders */}
      <div className="mt-8 border-t pt-6">
        <h2 className="font-semibold text-sm mb-3">Historial de pedidos de esta mesa</h2>
        <div className="space-y-2">
          {[
            { num: orderNumber, status: 'En preparación', time: '14:38', total: 'S/ 94.60' },
            { num: orderNumber - 1, status: 'Entregado', time: '13:15', total: 'S/ 62.00' },
          ].map(order => (
            <div key={order.num} className="bg-card border rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Pedido #{order.num}</p>
                <p className="text-xs text-muted-foreground">{order.time} · {order.status}</p>
              </div>
              <span className="font-display text-sm text-primary">{order.total}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate('/cliente/menu')}
        className="w-full mt-6 py-3 border rounded-xl font-medium text-sm active:scale-[0.97] transition-transform"
      >
        Agregar más productos
      </button>
    </div>
  );
}
