import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, Check, ChefHat, Clock, Package } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useApp } from '@/context/AppContext';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { getDiningSessionRequest } from '@/services/diningSessionService';
import type { OrderRecord } from '@/services/orderService';
import { createSessionRealtimeSource } from '@/services/realtimeService';

const steps = [
  { id: 'received', label: 'Recibido', sublabel: 'Tu pedido fue registrado', icon: Check },
  { id: 'preparing', label: 'En preparaciÃ³n', sublabel: 'La cocina estÃ¡ trabajando en tu pedido', icon: ChefHat },
  { id: 'ready', label: 'Listo', sublabel: 'Tu pedido estÃ¡ listo para servir', icon: Package },
  { id: 'delivered', label: 'Entregado', sublabel: 'Â¡Buen provecho!', icon: Bell },
] as const;

const statusLabels: Record<OrderRecord['orderStatus'], string> = {
  received: 'Recibido',
  preparing: 'En preparaciÃ³n',
  ready: 'Listo',
  delivered: 'Entregado',
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatTime(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export default function ClientTracking() {
  const navigate = useNavigate();
  const { session, lastSubmittedOrder } = useApp();
  const sessionRealtimeSource = useMemo(
    () =>
      session?.sessionToken
        ? () => createSessionRealtimeSource(session.sessionToken)
        : null,
    [session?.sessionToken],
  );

  const sessionQuery = useQuery({
    queryKey: ['client', 'session', 'tracking', session?.sessionToken],
    queryFn: () => getDiningSessionRequest(session?.sessionToken as string),
    enabled: Boolean(session?.sessionToken),
  });

  useRealtimeSubscription(
    sessionRealtimeSource,
    ({ event }) => {
      if (event.startsWith('order.')) {
        void sessionQuery.refetch();
      }
    },
  );

  const orders = useMemo(() => {
    const currentOrders = sessionQuery.data?.orders ?? [];

    return [...currentOrders].sort((leftOrder, rightOrder) => {
      const leftDate = new Date(leftOrder.createdAt).getTime();
      const rightDate = new Date(rightOrder.createdAt).getTime();

      return rightDate - leftDate;
    });
  }, [sessionQuery.data?.orders]);

  const currentOrder =
    orders.find((order) => order.id === lastSubmittedOrder?.id) ||
    orders.find((order) => order.orderStatus !== 'delivered') ||
    orders[0];

  const currentStep = currentOrder
    ? steps.findIndex((step) => step.id === currentOrder.orderStatus)
    : -1;
  const progressWidth = currentStep >= 0 ? `${(currentStep + 1) * 25}%` : '0%';

  if (!session) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTitle>SesiÃ³n no disponible</AlertTitle>
          <AlertDescription>
            Escanea el QR de tu mesa para consultar el seguimiento del pedido.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-5 pt-5 animate-fade-in">
      <h1 className="font-display text-2xl mb-1">Seguimiento</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {session.table?.name ?? 'Mesa no determinada'} Â·{' '}
        {currentOrder ? `Pedido #${currentOrder.number}` : 'Sin pedidos activos'}
      </p>

      {sessionQuery.error && (
        <Alert className="mb-6 border-destructive/30 bg-destructive/5">
          <AlertTitle>No se pudo consultar la sesiÃ³n</AlertTitle>
          <AlertDescription>
            {sessionQuery.error instanceof Error
              ? sessionQuery.error.message
              : 'Error inesperado al obtener el seguimiento.'}
          </AlertDescription>
        </Alert>
      )}

      {!currentOrder ? (
        <div className="bg-card border rounded-2xl p-6 text-center text-muted-foreground">
          AÃºn no hay pedidos registrados en esta sesiÃ³n.
        </div>
      ) : (
        <>
          <div className="bg-primary/8 border border-primary/15 rounded-2xl p-5 mb-8 text-center">
            <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Estado actual del pedido</p>
            <p className="font-display text-3xl text-primary">
              {statusLabels[currentOrder.orderStatus]}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {currentOrder.estimatedReadyAt
                ? `Estimado: ${formatTime(currentOrder.estimatedReadyAt)}`
                : 'Sin hora estimada disponible'}
            </p>
            <div className="w-full bg-primary/15 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: progressWidth, animation: 'progress-bar 2s ease-out both' }}
              />
            </div>
          </div>

          <div className="relative pl-8 space-y-0">
            {steps.map((step, index) => {
              const done = index <= currentStep;
              const active = index === currentStep;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className="relative pb-8 last:pb-0 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute left-[-20px] top-8 w-0.5 h-full ${
                        done ? 'bg-primary' : 'bg-border'
                      }`}
                    />
                  )}
                  <div
                    className={`absolute left-[-28px] top-1 w-5 h-5 rounded-full flex items-center justify-center ${
                      done
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted border-2 border-border'
                    } ${active ? 'ring-4 ring-primary/20' : ''}`}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-semibold text-sm ${
                          done ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                      >
                        {step.label}
                      </h3>
                      {active && (
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse-soft">
                          En curso
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.sublabel}</p>
                    {step.id === currentOrder.orderStatus && currentOrder.orderedAtLabel && (
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {currentOrder.orderedAtLabel}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-8 border-t pt-6">
        <h2 className="font-semibold text-sm mb-3">Historial de pedidos de esta mesa</h2>
        <div className="space-y-2">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-card border rounded-xl p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium">Pedido #{order.number}</p>
                <p className="text-xs text-muted-foreground">
                  {(order.orderedAtLabel || formatTime(order.createdAt) || 'Hora no determinada')}{' '}
                  Â· {statusLabels[order.orderStatus]}
                </p>
              </div>
              <span className="font-display text-sm text-primary">
                {formatMoney(Number(order.total))}
              </span>
            </div>
          ))}

          {!orders.length && (
            <div className="bg-card border rounded-xl p-3 text-sm text-muted-foreground">
              No hay historial aÃºn para esta sesiÃ³n.
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => navigate('/cliente/menu')}
        className="w-full mt-6 py-3 border rounded-xl font-medium text-sm active:scale-[0.97] transition-transform"
      >
        Agregar mÃ¡s productos
      </button>
    </div>
  );
}
