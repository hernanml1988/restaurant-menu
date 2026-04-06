import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bell, Check, HelpCircle, Receipt } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { useApp } from '@/context/AppContext';
import { getDiningSessionRequest } from '@/services/diningSessionService';
import {
  createPublicServiceRequestRequest,
  type ServiceRequestType,
} from '@/services/serviceRequestService';

const actions: Array<{
  id: ServiceRequestType;
  label: string;
  description: string;
  icon: typeof Bell;
  color: string;
}> = [
  {
    id: 'waiter',
    label: 'Llamar mesero',
    description: 'Un mesero se acercará a tu mesa',
    icon: Bell,
    color: 'bg-primary/10 text-primary',
  },
  {
    id: 'bill',
    label: 'Solicitar cuenta',
    description: 'Te enviaremos el resumen para pagar',
    icon: Receipt,
    color: 'bg-accent/10 text-accent',
  },
  {
    id: 'help',
    label: 'Necesito ayuda',
    description: 'Para consultas, quejas o solicitudes especiales',
    icon: HelpCircle,
    color: 'bg-status-preparing/10 text-status-preparing',
  },
];

export default function ClientCallWaiter() {
  const { session } = useApp();
  const [sent, setSent] = useState<ServiceRequestType | null>(null);

  const sessionQuery = useQuery({
    queryKey: ['client', 'session', 'help', session?.sessionToken],
    queryFn: () => getDiningSessionRequest(session?.sessionToken as string),
    enabled: Boolean(session?.sessionToken),
  });

  const sessionOrders = sessionQuery.data?.orders ?? [];
  const hasOrders = sessionOrders.length > 0;
  const allOrdersDelivered = hasOrders
    ? sessionOrders.every((order) => order.orderStatus === 'delivered')
    : false;

  const createServiceRequest = useMutation({
    mutationFn: createPublicServiceRequestRequest,
    onSuccess: (serviceRequest) => {
      setSent(serviceRequest.type);
      toast({ title: 'Solicitud enviada' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo enviar la solicitud',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });

  const handleSendRequest = (type: ServiceRequestType) => {
    if (!session) {
      toast({
        title: 'Sesión no disponible',
        description: 'Escanea el QR de la mesa antes de solicitar ayuda.',
        variant: 'destructive',
      });
      return;
    }

    if (type === 'bill') {
      if (sessionQuery.isLoading) {
        toast({
          title: 'Validando pedidos',
          description: 'Espera un momento mientras revisamos el estado de tu cuenta.',
        });
        return;
      }

      if (!hasOrders) {
        toast({
          title: 'Aun no puedes pedir la cuenta',
          description: 'Primero necesitas tener al menos un pedido registrado en esta sesion.',
          variant: 'destructive',
        });
        return;
      }

      if (!allOrdersDelivered) {
        toast({
          title: 'Aun hay pedidos en curso',
          description: 'La cuenta se puede solicitar solo cuando todos los pedidos esten entregados.',
          variant: 'destructive',
        });
        return;
      }
    }

    createServiceRequest.mutate({
      sessionToken: session.sessionToken,
      type,
    });
  };

  return (
    <div className="px-5 pt-5 animate-fade-in">
      <h1 className="font-display text-2xl mb-1">¿Necesitas algo?</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {session?.table?.name ?? 'Mesa no determinada'} · Estamos para atenderte
      </p>

      {!session && (
        <Alert className="mb-6">
          <AlertTitle>Sesión requerida</AlertTitle>
          <AlertDescription>
            Necesitas una mesa activa para enviar solicitudes al equipo del restaurante.
          </AlertDescription>
        </Alert>
      )}

      {session && sessionQuery.error && (
        <Alert className="mb-6 border-destructive/30 bg-destructive/5">
          <AlertTitle>No se pudo validar la cuenta</AlertTitle>
          <AlertDescription>
            {sessionQuery.error instanceof Error
              ? sessionQuery.error.message
              : 'Error inesperado al consultar el estado de los pedidos.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {actions.map((action, index) => (
          (() => {
            const isBillAction = action.id === 'bill';
            const billBlocked =
              isBillAction &&
              (!session ||
                sessionQuery.isLoading ||
                sessionQuery.isError ||
                !hasOrders ||
                !allOrdersDelivered);
            const description = sent === action.id
              ? 'Solicitud enviada. Un momento por favor...'
              : isBillAction && session
                ? sessionQuery.isLoading
                  ? 'Validando si todos los pedidos ya fueron entregados...'
                  : !hasOrders
                    ? 'Disponible cuando exista al menos un pedido en la sesion.'
                    : !allOrdersDelivered
                      ? 'Disponible solo cuando todos los pedidos esten entregados.'
                      : action.description
                : action.description;

            return (
              <button
                key={action.id}
                onClick={() => handleSendRequest(action.id)}
                disabled={createServiceRequest.isPending || billBlocked}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border text-left transition-all active:scale-[0.97] animate-slide-up ${
                  sent === action.id
                    ? 'bg-accent/5 border-accent/30'
                    : billBlocked
                      ? 'bg-muted/50 border-border opacity-70 cursor-not-allowed'
                      : 'bg-card hover:shadow-md'
                }`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${action.color}`}>
                  {sent === action.id ? (
                    <Check className="w-6 h-6 text-accent" />
                  ) : (
                    <action.icon className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{action.label}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </button>
            );
          })()
        ))}
      </div>

      {sent && (
        <div className="mt-8 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-3">
            <Check className="w-8 h-8 text-accent" />
          </div>
          <p className="font-semibold">Solicitud enviada</p>
          <p className="text-sm text-muted-foreground mt-1">
            Nuestro equipo fue notificado. Atenderemos tu solicitud lo antes posible.
          </p>
          <button
            onClick={() => setSent(null)}
            className="mt-4 text-sm text-primary underline underline-offset-4"
          >
            Enviar otra solicitud
          </button>
        </div>
      )}
    </div>
  );
}
