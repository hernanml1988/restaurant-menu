import { useState } from 'react';
import { Bell, Receipt, HelpCircle, Check } from 'lucide-react';
import { RESTAURANT } from '@/data/mockData';

const actions = [
  { id: 'waiter', label: 'Llamar mesero', description: 'Un mesero se acercará a tu mesa', icon: Bell, color: 'bg-primary/10 text-primary' },
  { id: 'bill', label: 'Solicitar cuenta', description: 'Te enviaremos el resumen para pagar', icon: Receipt, color: 'bg-accent/10 text-accent' },
  { id: 'help', label: 'Necesito ayuda', description: 'Para consultas, quejas o solicitudes especiales', icon: HelpCircle, color: 'bg-status-preparing/10 text-status-preparing' },
];

export default function ClientCallWaiter() {
  const [sent, setSent] = useState<string | null>(null);

  return (
    <div className="px-5 pt-5 animate-fade-in">
      <h1 className="font-display text-2xl mb-1">¿Necesitas algo?</h1>
      <p className="text-sm text-muted-foreground mb-6">{RESTAURANT.currentTable} · Estamos para atenderte</p>

      <div className="space-y-3">
        {actions.map((action, i) => (
          <button
            key={action.id}
            onClick={() => setSent(action.id)}
            disabled={sent === action.id}
            className={`w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all active:scale-[0.97] animate-slide-up ${
              sent === action.id ? 'bg-accent/5 border-accent/30' : 'bg-card hover:shadow-md'
            }`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${action.color}`}>
              {sent === action.id ? <Check className="w-6 h-6 text-accent" /> : <action.icon className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-semibold">{action.label}</h3>
              <p className="text-sm text-muted-foreground">
                {sent === action.id ? 'Solicitud enviada. Un momento por favor...' : action.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {sent && (
        <div className="mt-8 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-3">
            <Check className="w-8 h-8 text-accent" />
          </div>
          <p className="font-semibold">Solicitud enviada</p>
          <p className="text-sm text-muted-foreground mt-1">Nuestro equipo fue notificado. Atenderemos tu solicitud lo antes posible.</p>
          <button onClick={() => setSent(null)} className="mt-4 text-sm text-primary underline underline-offset-4">
            Enviar otra solicitud
          </button>
        </div>
      )}
    </div>
  );
}
