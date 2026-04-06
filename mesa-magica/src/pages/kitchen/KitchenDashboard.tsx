import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  ChefHat,
  Clock,
  Eye,
  LogOut,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import * as orderService from '@/services/orderService';
import { createInternalRealtimeSource } from '@/services/realtimeService';
import {
  type OrderPriority,
  type OrderRecord,
  type OrderStatus,
} from '@/services/orderService';

type KitchenBoardStatus = Extract<OrderStatus, 'received' | 'preparing' | 'ready'>;

interface KitchenBoardItem {
  id: string;
  quantity: number;
  name: string;
  extras: string[];
  notes: string | null;
}

interface KitchenBoardOrder {
  id: string;
  number: number;
  status: KitchenBoardStatus;
  priority: OrderPriority;
  tableName: string;
  timestamp: string;
  totalLabel: string;
  observations: string | null;
  items: KitchenBoardItem[];
}

const columns: Array<{
  id: KitchenBoardStatus;
  label: string;
  color: string;
  dotColor: string;
}> = [
  {
    id: 'received',
    label: 'Pendiente',
    color: 'bg-status-pending',
    dotColor: 'bg-status-pending',
  },
  {
    id: 'preparing',
    label: 'Preparando',
    color: 'bg-status-preparing',
    dotColor: 'bg-status-preparing',
  },
  {
    id: 'ready',
    label: 'Listo',
    color: 'bg-status-ready',
    dotColor: 'bg-status-ready',
  },
];

const nextStatus: Record<KitchenBoardStatus, KitchenBoardStatus | 'delivered'> = {
  received: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
};

const statusLabel: Record<KitchenBoardStatus, string> = {
  received: 'Comenzar',
  preparing: 'Marcar listo',
  ready: 'Entregar',
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatKitchenTimestamp(order: OrderRecord) {
  if (order.orderedAtLabel) {
    return order.orderedAtLabel;
  }

  const date = new Date(order.createdAt);

  if (Number.isNaN(date.getTime())) {
    return 'Hora no determinada';
  }

  return new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function mapKitchenOrder(order: OrderRecord): KitchenBoardOrder | null {
  if (
    order.orderStatus !== 'received' &&
    order.orderStatus !== 'preparing' &&
    order.orderStatus !== 'ready'
  ) {
    return null;
  }

  return {
    id: order.id,
    number: order.number,
    status: order.orderStatus,
    priority: order.priority,
    tableName: order.table?.name ?? 'Mesa no determinada',
    timestamp: formatKitchenTimestamp(order),
    totalLabel: formatMoney(Number(order.total)),
    observations: order.observations ?? null,
    items: order.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      name: item.productName,
      extras: item.selectedExtras.map((extra) => extra.value),
      notes: item.notes,
    })),
  };
}

export default function KitchenDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const kitchenOrdersQuery = useQuery({
    queryKey: ['kitchen', 'orders'],
    queryFn:
      orderService.getKitchenBoardOrdersRequest ?? orderService.getOrdersRequest,
  });

  useRealtimeSubscription(createInternalRealtimeSource, ({ event }) => {
    if (event.startsWith('order.')) {
      void queryClient.invalidateQueries({ queryKey: ['kitchen', 'orders'] });
    }
  });

  const updateOrder = useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: Parameters<typeof orderService.updateOrderRequest>[1];
    }) => orderService.updateOrderRequest(orderId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['kitchen', 'orders'] });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo actualizar el pedido',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });

  const orders = useMemo(
    () =>
      (kitchenOrdersQuery.data ?? [])
        .map(mapKitchenOrder)
        .filter((order): order is KitchenBoardOrder => order !== null),
    [kitchenOrdersQuery.data],
  );

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const activeOrdersCount = orders.length;

  const moveOrder = (orderId: string, currentStatus: KitchenBoardStatus) => {
    updateOrder.mutate(
      {
        orderId,
        payload: {
          orderStatus: nextStatus[currentStatus],
        },
      },
      {
        onSuccess: () => {
          if (currentStatus === 'ready') {
            setSelectedOrderId(null);
          }

          toast({
            title:
              currentStatus === 'received'
                ? 'Pedido en preparación'
                : currentStatus === 'preparing'
                  ? 'Pedido marcado como listo'
                  : 'Pedido entregado',
          });
        },
      },
    );
  };

  const togglePriority = (order: KitchenBoardOrder) => {
    updateOrder.mutate(
      {
        orderId: order.id,
        payload: {
          priority: order.priority === 'high' ? 'normal' : 'high',
        },
      },
      {
        onSuccess: () => {
          toast({
            title:
              order.priority === 'high'
                ? 'Prioridad alta removida'
                : 'Pedido marcado con prioridad alta',
          });
        },
      },
    );
  };

  return (
    <div className="kitchen-theme min-h-screen bg-background text-foreground">
      <header className="border-b px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted active:scale-[0.95]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="flex items-center gap-2 font-display text-xl">
                <ChefHat className="h-5 w-5 text-status-pending" />
                Panel de Cocina
              </h1>
              <p className="text-xs text-muted-foreground">
                {activeOrdersCount} pedidos activos en estacion cocina
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            {user ? (
              <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/60 px-4 py-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-pending/15 text-status-pending">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-sm font-medium">{user.fullName}</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Cocina
                  </p>
                </div>
                <button
                  onClick={() => {
                    void logout();
                    navigate('/login', { replace: true });
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Cerrar sesion"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            <div className="rounded-2xl border border-border/70 bg-card/60 px-4 py-3 text-xs text-muted-foreground">
              La vista usa el endpoint operativo de cocina y actualiza estados en backend.
            </div>
          </div>
        </div>
      </header>

      {kitchenOrdersQuery.error ? (
        <div className="p-6">
          <Alert className="border-destructive/30 bg-destructive/5 text-foreground">
            <AlertTitle>No se pudieron cargar los pedidos de cocina</AlertTitle>
            <AlertDescription>
              {kitchenOrdersQuery.error instanceof Error
                ? kitchenOrdersQuery.error.message
                : 'Verifica la sesion y la API.'}
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      <div className="grid h-[calc(100vh-97px)] grid-cols-1 gap-6 overflow-hidden p-6 md:grid-cols-3">
        {columns.map((column) => {
          const columnOrders = orders.filter((order) => order.status === column.id);

          return (
            <div key={column.id} className="flex min-h-0 flex-col">
              <div className="mb-4 flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${column.dotColor}`} />
                <h2 className="text-sm font-semibold">{column.label}</h2>
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                  {columnOrders.length}
                </span>
              </div>

              <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto pr-1">
                {kitchenOrdersQuery.isLoading ? (
                  <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                    Cargando pedidos...
                  </div>
                ) : null}

                {!kitchenOrdersQuery.isLoading &&
                  columnOrders.map((order, index) => (
                    <div
                      key={order.id}
                      className={`animate-slide-up rounded-xl border bg-card p-4 transition-all hover:shadow-lg ${
                        order.priority === 'high' ? 'border-status-pending/40' : ''
                      }`}
                      style={{ animationDelay: `${index * 60}ms` }}
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">#{order.number}</span>
                            {order.priority === 'high' ? (
                              <span className="flex items-center gap-1 rounded bg-status-pending/15 px-1.5 py-0.5 text-[10px] font-bold text-status-pending">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                Prioridad
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground">{order.tableName}</p>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {order.timestamp}
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {order.totalLabel}
                          </span>
                        </div>
                      </div>

                      <div className="mb-3 space-y-1.5">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-start gap-2 text-sm">
                            <span className="mt-0.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                              {item.quantity}x
                            </span>
                            <div>
                              <span className="font-medium">{item.name}</span>
                              {item.extras.length ? (
                                <p className="text-xs text-muted-foreground">
                                  {item.extras.join(', ')}
                                </p>
                              ) : null}
                              {item.notes ? (
                                <p className="text-xs italic text-status-pending">
                                  {item.notes}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>

                      {order.observations ? (
                        <p className="mb-3 rounded-lg bg-status-pending/10 px-3 py-2 text-xs text-status-pending">
                          {order.observations}
                        </p>
                      ) : null}

                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrderId(order.id)}
                          className="flex-1 rounded-lg border py-2 text-xs font-medium hover:bg-muted active:scale-[0.97]"
                        >
                          <span className="flex items-center justify-center gap-1">
                            <Eye className="h-3 w-3" />
                            Detalle
                          </span>
                        </button>

                        <button
                          onClick={() => moveOrder(order.id, order.status)}
                          disabled={updateOrder.isPending}
                          className={`flex-1 rounded-lg py-2 text-xs font-medium text-white active:scale-[0.97] ${
                            column.id === 'received'
                              ? 'bg-status-preparing'
                              : column.id === 'preparing'
                                ? 'bg-status-ready'
                                : 'bg-primary'
                          }`}
                        >
                          {statusLabel[order.status]}
                        </button>
                      </div>
                    </div>
                  ))}

                {!kitchenOrdersQuery.isLoading && !columnOrders.length ? (
                  <div className="rounded-xl border border-dashed border-border bg-card/50 py-12 text-center text-sm text-muted-foreground">
                    Sin pedidos
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {selectedOrder ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setSelectedOrderId(null)}
        >
          <div
            className="animate-scale-in w-full max-w-md rounded-2xl bg-card p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl">Pedido #{selectedOrder.number}</h2>
              <button
                onClick={() => setSelectedOrderId(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                Cerrar
              </button>
            </div>

            <div className="mb-4 space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Mesa:</span>{' '}
                {selectedOrder.tableName}
              </p>
              <p>
                <span className="text-muted-foreground">Hora:</span>{' '}
                {selectedOrder.timestamp}
              </p>
              <p>
                <span className="text-muted-foreground">Total:</span>{' '}
                {selectedOrder.totalLabel}
              </p>
              <p>
                <span className="text-muted-foreground">Prioridad:</span>{' '}
                {selectedOrder.priority === 'high' ? 'Alta' : 'Normal'}
              </p>
            </div>

            <div className="mb-4 flex gap-2">
              <button
                onClick={() => togglePriority(selectedOrder)}
                disabled={updateOrder.isPending}
                className="flex-1 rounded-xl border border-border py-2 text-sm font-medium hover:bg-muted"
              >
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {selectedOrder.priority === 'high'
                    ? 'Quitar prioridad'
                    : 'Marcar prioridad'}
                </span>
              </button>
            </div>

            <h3 className="mb-2 text-sm font-semibold">Productos</h3>
            <div className="mb-4 space-y-2">
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="rounded-lg bg-muted p-3">
                  <p className="font-medium">
                    {item.quantity}x {item.name}
                  </p>
                  {item.extras.length ? (
                    <p className="text-xs text-muted-foreground">
                      {item.extras.join(', ')}
                    </p>
                  ) : null}
                  {item.notes ? (
                    <p className="text-xs text-status-pending">Nota: {item.notes}</p>
                  ) : null}
                </div>
              ))}
            </div>

            {selectedOrder.observations ? (
              <div className="mb-4 rounded-lg bg-status-pending/10 px-3 py-2 text-sm text-status-pending">
                {selectedOrder.observations}
              </div>
            ) : null}

            <button
              onClick={() => moveOrder(selectedOrder.id, selectedOrder.status)}
              disabled={updateOrder.isPending}
              className="w-full rounded-xl bg-status-preparing py-3 font-medium text-white active:scale-[0.97]"
            >
              {statusLabel[selectedOrder.status]}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
