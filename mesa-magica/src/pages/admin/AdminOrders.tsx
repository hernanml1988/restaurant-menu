import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Clock3,
  Edit,
  Eye,
  Search,
  Trash2,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  deactivateOrderRequest,
  getOrderRequest,
  getOrdersRequest,
  updateOrderRequest,
  type OrderPriority,
  type OrderRecord,
  type OrderStation,
  type OrderStatus,
} from '@/services/orderService';

type OrderForm = {
  orderStatus: OrderStatus;
  priority: OrderPriority;
  station: OrderStation;
  observations: string;
  estimatedReadyAt: string;
  deliveredAt: string;
};

const statusConfig: Record<
  OrderStatus,
  { label: string; badgeClassName: string }
> = {
  received: {
    label: 'Recibido',
    badgeClassName: 'bg-status-pending/10 text-status-pending',
  },
  preparing: {
    label: 'Preparando',
    badgeClassName: 'bg-status-preparing/10 text-status-preparing',
  },
  ready: {
    label: 'Listo',
    badgeClassName: 'bg-status-ready/10 text-status-ready',
  },
  delivered: {
    label: 'Entregado',
    badgeClassName: 'bg-status-delivered/10 text-status-delivered',
  },
};

const priorityOptions: Array<{ value: OrderPriority; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
];

const stationOptions: Array<{ value: OrderStation; label: string }> = [
  { value: 'cocina', label: 'Cocina' },
  { value: 'bar', label: 'Bar' },
  { value: 'postres', label: 'Postres' },
];

const statusOptions: Array<{ value: OrderStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'received', label: 'Recibido' },
  { value: 'preparing', label: 'Preparando' },
  { value: 'ready', label: 'Listo' },
  { value: 'delivered', label: 'Entregado' },
];

const emptyOrderForm: OrderForm = {
  orderStatus: 'received',
  priority: 'normal',
  station: 'cocina',
  observations: '',
  estimatedReadyAt: '',
  deliveredAt: '',
};

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return 'No definido';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'No definido';
  }

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatDateInput(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - timezoneOffset * 60000);
  return localDate.toISOString().slice(0, 16);
}

function getOrderSearchableText(order: OrderRecord) {
  return [
    order.number,
    order.table?.name,
    order.table?.number,
    order.station,
    order.observations,
    order.items.map((item) => item.productName).join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export default function AdminOrders() {
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<OrderStatus | 'all'>('all');
  const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<OrderRecord | null>(null);
  const [orderForm, setOrderForm] = useState<OrderForm>(emptyOrderForm);
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: getOrdersRequest,
  });

  const orderDetailQuery = useQuery({
    queryKey: ['admin', 'orders', viewingOrderId],
    queryFn: () => getOrderRequest(viewingOrderId as string),
    enabled: !!viewingOrderId,
  });

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);
  const activeOrders = useMemo(
    () => orders.filter((order) => order.state),
    [orders],
  );
  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return activeOrders.filter((order) => {
      const matchesStatus =
        activeStatus === 'all' || order.orderStatus === activeStatus;
      const matchesSearch =
        !term || getOrderSearchableText(order).includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [activeOrders, activeStatus, search]);

  useEffect(() => {
    if (!editingOrder) {
      setOrderForm(emptyOrderForm);
      return;
    }

    setOrderForm({
      orderStatus: editingOrder.orderStatus,
      priority: editingOrder.priority,
      station: editingOrder.station,
      observations: editingOrder.observations ?? '',
      estimatedReadyAt: formatDateInput(editingOrder.estimatedReadyAt),
      deliveredAt: formatDateInput(editingOrder.deliveredAt),
    });
  }, [editingOrder]);

  const refreshOrders = (orderId?: string | null) => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    if (orderId) {
      void queryClient.invalidateQueries({
        queryKey: ['admin', 'orders', orderId],
      });
    }
  };

  const updateOrder = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateOrderRequest>[1];
    }) => updateOrderRequest(id, payload),
    onSuccess: (order) => {
      refreshOrders(order.id);
      setEditingOrder(null);
      toast({ title: 'Pedido actualizado' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo actualizar el pedido',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });

  const deleteOrder = useMutation({
    mutationFn: deactivateOrderRequest,
    onSuccess: (_, orderId) => {
      refreshOrders(orderId);
      if (viewingOrderId === orderId) {
        setViewingOrderId(null);
      }
      setOrderToDelete(null);
      toast({ title: 'Pedido eliminado' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo eliminar el pedido',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });

  const submitOrder = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingOrder) {
      return;
    }

    updateOrder.mutate({
      id: editingOrder.id,
      payload: {
        orderStatus: orderForm.orderStatus,
        priority: orderForm.priority,
        station: orderForm.station,
        observations: orderForm.observations,
        estimatedReadyAt: orderForm.estimatedReadyAt
          ? new Date(orderForm.estimatedReadyAt).toISOString()
          : null,
        deliveredAt: orderForm.deliveredAt
          ? new Date(orderForm.deliveredAt).toISOString()
          : null,
      },
    });
  };

  const loadingError = ordersQuery.error;
  const selectedOrder = orderDetailQuery.data ?? null;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-1 font-display text-3xl">Pedidos</h1>
          <p className="text-muted-foreground">
            {activeOrders.length} pedidos activos en el backend
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por mesa, numero o producto"
          />
        </div>
      </div>

      {loadingError && (
        <Alert className="border-destructive/30 bg-destructive/5">
          <AlertTitle>No se pudieron cargar los pedidos</AlertTitle>
          <AlertDescription>
            {loadingError instanceof Error
              ? loadingError.message
              : 'Verifica la sesion activa y la API.'}
          </AlertDescription>
        </Alert>
      )}

      <section className="rounded-2xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <div>
            <h2 className="font-display text-2xl">Operacion de pedidos</h2>
            <p className="text-sm text-muted-foreground">
              Lista, detalle, edicion y baja logica del flujo de pedidos.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <button
                key={status.value}
                type="button"
                onClick={() => setActiveStatus(status.value)}
                className={`rounded-lg px-3 py-2 text-xs font-medium ${
                  activeStatus === status.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Pedido
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Mesa
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Estado
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Estacion
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Total
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {ordersQuery.isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Cargando pedidos...
                  </td>
                </tr>
              )}

              {!ordersQuery.isLoading &&
                filteredOrders.map((order) => {
                  const status = statusConfig[order.orderStatus];

                  return (
                    <tr
                      key={order.id}
                      className="border-b last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">#{order.number}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.items
                              .map((item) => `${item.quantity}x ${item.productName}`)
                              .join(', ')}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">
                            {order.table?.name ?? 'Mesa no determinada'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.orderedAtLabel || formatDateTime(order.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${status.badgeClassName}`}
                          >
                            {status.label}
                          </span>
                          {order.priority === 'high' && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-status-pending/10 px-2.5 py-1 text-xs font-medium text-status-pending">
                              <AlertCircle className="h-3 w-3" /> Alta
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">
                        {order.station}
                      </td>
                      <td className="px-4 py-3 text-right font-display">
                        {formatMoney(Number(order.total))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            className="rounded-lg p-2 hover:bg-muted"
                            onClick={() => setViewingOrderId(order.id)}
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2 hover:bg-muted"
                            onClick={() => setEditingOrder(order)}
                          >
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2 hover:bg-muted"
                            onClick={() => setOrderToDelete(order)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {!ordersQuery.isLoading && !filteredOrders.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No hay pedidos para el filtro actual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog
        open={!!viewingOrderId}
        onOpenChange={(open) => {
          if (!open) {
            setViewingOrderId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedOrder ? `Pedido #${selectedOrder.number}` : 'Detalle del pedido'}
            </DialogTitle>
            <DialogDescription>
              Vista por id del pedido seleccionado.
            </DialogDescription>
          </DialogHeader>

          {orderDetailQuery.isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Cargando detalle del pedido...
            </p>
          )}

          {orderDetailQuery.error && (
            <Alert className="border-destructive/30 bg-destructive/5">
              <AlertTitle>No se pudo obtener el pedido</AlertTitle>
              <AlertDescription>
                {orderDetailQuery.error instanceof Error
                  ? orderDetailQuery.error.message
                  : 'Error inesperado.'}
              </AlertDescription>
            </Alert>
          )}

          {selectedOrder && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Mesa
                  </p>
                  <p className="mt-2 font-medium">
                    {selectedOrder.table?.name ?? 'Mesa no determinada'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sesion:{' '}
                    {selectedOrder.diningSession?.sessionToken ?? 'No determinada'}
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Horarios
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>Creado: {formatDateTime(selectedOrder.createdAt)}</p>
                    <p>Estimado: {formatDateTime(selectedOrder.estimatedReadyAt)}</p>
                    <p>Entregado: {formatDateTime(selectedOrder.deliveredAt)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <p className="mt-2 font-medium">
                    {statusConfig[selectedOrder.orderStatus].label}
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">Prioridad</p>
                  <p className="mt-2 font-medium capitalize">
                    {selectedOrder.priority}
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">Estacion</p>
                  <p className="mt-2 font-medium capitalize">
                    {selectedOrder.station}
                  </p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="mt-2 font-medium">
                    {formatMoney(Number(selectedOrder.total))}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Items del pedido</h3>
                </div>

                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium">
                          {item.quantity}x {item.productName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Unitario: {formatMoney(Number(item.unitPrice))}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatMoney(Number(item.subtotal))}
                      </p>
                    </div>

                    {item.notes && (
                      <p className="mt-3 text-sm text-status-pending">
                        Nota: {item.notes}
                      </p>
                    )}

                    {!!item.selectedExtras.length && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.selectedExtras.map((extra) => (
                          <span
                            key={extra.id}
                            className="rounded-lg bg-muted px-2.5 py-1 text-xs"
                          >
                            {extra.value}
                            {Number(extra.priceImpact) > 0
                              ? ` (+${formatMoney(Number(extra.priceImpact))})`
                              : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Observaciones
                </p>
                <p className="mt-2 text-sm">
                  {selectedOrder.observations || 'Sin observaciones.'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingOrder}
        onOpenChange={(open) => {
          if (!open) {
            setEditingOrder(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingOrder ? `Editar pedido #${editingOrder.number}` : 'Editar pedido'}
            </DialogTitle>
            <DialogDescription>
              Ajusta estado operativo, prioridad y tiempos del pedido.
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={submitOrder}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="order-status">Estado</Label>
                <select
                  id="order-status"
                  value={orderForm.orderStatus}
                  onChange={(event) =>
                    setOrderForm((current) => ({
                      ...current,
                      orderStatus: event.target.value as OrderStatus,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {statusOptions
                    .filter((option) => option.value !== 'all')
                    .map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-priority">Prioridad</Label>
                <select
                  id="order-priority"
                  value={orderForm.priority}
                  onChange={(event) =>
                    setOrderForm((current) => ({
                      ...current,
                      priority: event.target.value as OrderPriority,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-station">Estacion</Label>
                <select
                  id="order-station"
                  value={orderForm.station}
                  onChange={(event) =>
                    setOrderForm((current) => ({
                      ...current,
                      station: event.target.value as OrderStation,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {stationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="order-estimated-ready-at">Hora estimada</Label>
                <Input
                  id="order-estimated-ready-at"
                  type="datetime-local"
                  value={orderForm.estimatedReadyAt}
                  onChange={(event) =>
                    setOrderForm((current) => ({
                      ...current,
                      estimatedReadyAt: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order-delivered-at">Hora de entrega</Label>
                <Input
                  id="order-delivered-at"
                  type="datetime-local"
                  value={orderForm.deliveredAt}
                  onChange={(event) =>
                    setOrderForm((current) => ({
                      ...current,
                      deliveredAt: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order-observations">Observaciones</Label>
              <Textarea
                id="order-observations"
                value={orderForm.observations}
                onChange={(event) =>
                  setOrderForm((current) => ({
                    ...current,
                    observations: event.target.value,
                  }))
                }
                placeholder="Notas internas para cocina, bar o entrega"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingOrder(null)}
                disabled={updateOrder.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateOrder.isPending}>
                {updateOrder.isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!orderToDelete}
        onOpenChange={(open) => !open && setOrderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar pedido</AlertDialogTitle>
            <AlertDialogDescription>
              {orderToDelete
                ? `Se desactivara el pedido #${orderToDelete.number}.`
                : 'Se desactivara el pedido seleccionado.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteOrder.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteOrder.isPending || !orderToDelete}
              onClick={() => orderToDelete && deleteOrder.mutate(orderToDelete.id)}
            >
              {deleteOrder.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
