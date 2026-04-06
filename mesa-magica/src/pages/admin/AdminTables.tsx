import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import QRCode from 'qrcode';
import {
  Pencil,
  Plus,
  QrCode,
  Trash2,
  Wifi,
  WifiOff,
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
import { toast } from '@/components/ui/use-toast';
import { getCurrentRestaurantRequest } from '@/services/restaurantService';
import {
  createTableRequest,
  deactivateTableRequest,
  getTablesRequest,
  type TableRecord,
  type TableStatus,
  updateTableRequest,
} from '@/services/tableService';

const statusConfig: Record<
  TableRecord['serviceStatus'],
  { label: string; color: string; bg: string }
> = {
  free: { label: 'Libre', color: 'text-accent', bg: 'bg-accent/10' },
  occupied: {
    label: 'Ocupada',
    color: 'text-status-pending',
    bg: 'bg-status-pending/10',
  },
  'with-order': {
    label: 'Con pedido',
    color: 'text-status-preparing',
    bg: 'bg-status-preparing/10',
  },
  'pending-payment': {
    label: 'Por cobrar',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
  },
};

const zones = ['Todas', 'Interior', 'Terraza', 'Barra'];
const editableStatuses: TableStatus[] = [
  'free',
  'occupied',
  'with-order',
  'pending-payment',
];

interface TableFormState {
  number: string;
  name: string;
  capacity: string;
  zone: string;
  serviceStatus: TableStatus;
  activeOrders: string;
  qrCode: string;
}

const defaultTableFormState: TableFormState = {
  number: '',
  name: '',
  capacity: '',
  zone: 'Interior',
  serviceStatus: 'free',
  activeOrders: '0',
  qrCode: '',
};

function QrPreview({ value }: { value: string }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    let mounted = true;

    const generateQr = async () => {
      try {
        const dataUrl = await QRCode.toDataURL(value, {
          width: 192,
          margin: 1,
        });

        if (mounted) {
          setQrDataUrl(dataUrl);
        }
      } catch {
        if (mounted) {
          setQrDataUrl('');
        }
      }
    };

    void generateQr();

    return () => {
      mounted = false;
    };
  }, [value]);

  if (!qrDataUrl) {
    return (
      <div className="mx-auto mb-2 flex h-32 w-32 items-center justify-center rounded-xl border-2 border-dashed border-border bg-card">
        <QrCode className="h-16 w-16 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={qrDataUrl}
      alt="QR de mesa"
      className="mx-auto mb-2 h-32 w-32 rounded-xl border bg-white p-2"
    />
  );
}

export default function AdminTables() {
  const [activeZone, setActiveZone] = useState('Todas');
  const [showQR, setShowQR] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableRecord | null>(null);
  const [tableToDelete, setTableToDelete] = useState<TableRecord | null>(null);
  const [formState, setFormState] =
    useState<TableFormState>(defaultTableFormState);
  const queryClient = useQueryClient();

  const tablesQuery = useQuery({
    queryKey: ['admin', 'tables'],
    queryFn: getTablesRequest,
  });

  const restaurantQuery = useQuery({
    queryKey: ['restaurant', 'current'],
    queryFn: getCurrentRestaurantRequest,
  });

  const activeTables = useMemo(
    () => (tablesQuery.data ?? []).filter((table) => table.state),
    [tablesQuery.data],
  );

  const restaurantId = useMemo(
    () =>
      restaurantQuery.data?.id ??
      activeTables.find((table) => table.restaurant?.id)?.restaurant?.id ??
      '',
    [activeTables, restaurantQuery.data],
  );

  const createTableMutation = useMutation({
    mutationFn: createTableRequest,
    onSuccess: () => {
      toast({
        title: 'Mesa creada',
        description:
          'La mesa se agregó correctamente y ya tiene URL QR generada.',
      });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'tables'] });
      setIsFormOpen(false);
      setFormState(defaultTableFormState);
    },
    onError: (error) => {
      toast({
        title: 'No se pudo crear la mesa',
        description:
          error instanceof Error
            ? error.message
            : 'Verifica los datos enviados.',
        variant: 'destructive',
      });
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: ({
      tableId,
      payload,
    }: {
      tableId: string;
      payload: Parameters<typeof updateTableRequest>[1];
    }) => updateTableRequest(tableId, payload),
    onSuccess: () => {
      toast({
        title: 'Mesa actualizada',
        description: 'Los cambios de la mesa quedaron guardados.',
      });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'tables'] });
      setIsFormOpen(false);
      setEditingTable(null);
      setFormState(defaultTableFormState);
    },
    onError: (error) => {
      toast({
        title: 'No se pudo actualizar la mesa',
        description:
          error instanceof Error
            ? error.message
            : 'Verifica los datos enviados.',
        variant: 'destructive',
      });
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: deactivateTableRequest,
    onSuccess: () => {
      toast({
        title: 'Mesa eliminada',
        description: 'La mesa fue desactivada correctamente.',
      });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'tables'] });
      setTableToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'No se pudo eliminar la mesa',
        description:
          error instanceof Error
            ? error.message
            : 'La mesa no pudo desactivarse.',
        variant: 'destructive',
      });
    },
  });

  const filtered =
    activeZone === 'Todas'
      ? activeTables
      : activeTables.filter((table) => table.zone === activeZone);

  const isSubmitting =
    createTableMutation.isPending || updateTableMutation.isPending;

  const openCreateDialog = () => {
    setEditingTable(null);
    setFormState(defaultTableFormState);
    setIsFormOpen(true);
  };

  const openEditDialog = (table: TableRecord) => {
    setEditingTable(table);
    setFormState({
      number: String(table.number),
      name: table.name,
      capacity: String(table.capacity),
      zone: table.zone,
      serviceStatus: table.serviceStatus,
      activeOrders: String(table.activeOrders),
      qrCode: table.qrCode,
    });
    setIsFormOpen(true);
  };

  const resetFormDialog = (open: boolean) => {
    setIsFormOpen(open);

    if (!open) {
      setEditingTable(null);
      setFormState(defaultTableFormState);
    }
  };

  const handleFormChange =
    (field: keyof TableFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormState((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.name.trim() || !formState.zone.trim()) {
      toast({
        title: 'Faltan datos',
        description: 'Ingresa al menos el nombre y la zona de la mesa.',
        variant: 'destructive',
      });
      return;
    }

    const number = Number(formState.number);
    const capacity = Number(formState.capacity);
    const activeOrders = Number(formState.activeOrders);

    if (
      !Number.isInteger(number) ||
      number < 1 ||
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      !Number.isInteger(activeOrders) ||
      activeOrders < 0
    ) {
      toast({
        title: 'Datos inválidos',
        description:
          'El número y la capacidad deben ser enteros positivos, y los pedidos activos no pueden ser negativos.',
        variant: 'destructive',
      });
      return;
    }

    if (!editingTable && !restaurantId) {
      toast({
        title: 'Falta configurar el restaurante',
        description:
          'No se pudo resolver el restaurante actual desde backend.',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      number,
      name: formState.name.trim(),
      capacity,
      zone: formState.zone.trim(),
      serviceStatus: formState.serviceStatus,
      activeOrders,
      ...(formState.qrCode.trim() ? { qrCode: formState.qrCode.trim() } : {}),
    };

    if (editingTable) {
      updateTableMutation.mutate({
        tableId: editingTable.id,
        payload,
      });
      return;
    }

    createTableMutation.mutate({
      restaurantId,
      ...payload,
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 font-display text-3xl">Mesas</h1>
          <p className="text-muted-foreground">
            Gestión y estado de mesas del restaurante
          </p>
        </div>
        <button
          onClick={openCreateDialog}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" /> Nueva mesa
        </button>
      </div>

      {!restaurantId && (
        <Alert className="mb-6 border-status-pending/30 bg-status-pending/5">
          <AlertTitle>Configuración pendiente para crear mesas</AlertTitle>
          <AlertDescription>
            No se pudo cargar el restaurante actual desde backend. Verifica que
            la API esté disponible y que exista el recurso
            `restaurant/public/current`.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6 flex gap-2">
        {zones.map((zone) => (
          <button
            key={zone}
            onClick={() => setActiveZone(zone)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              activeZone === zone
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {zone}
          </button>
        ))}
      </div>

      {tablesQuery.isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-48 rounded-2xl border bg-card p-5 animate-pulse"
            />
          ))}
        </div>
      )}

      {tablesQuery.isError && (
        <Alert className="mb-6 border-destructive/30 bg-destructive/5">
          <AlertTitle>No se pudieron cargar las mesas</AlertTitle>
          <AlertDescription>
            {tablesQuery.error instanceof Error
              ? tablesQuery.error.message
              : 'Verifica la sesión activa y la conexión con el backend.'}
          </AlertDescription>
        </Alert>
      )}

      {!tablesQuery.isLoading && !tablesQuery.isError && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((table, index) => {
            const status = statusConfig[table.serviceStatus];

            return (
              <div
                key={table.id}
                className="animate-slide-up rounded-2xl border bg-card p-5 transition-all hover:shadow-md"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{table.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {table.zone} · {table.capacity} personas
                    </p>
                  </div>
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium ${status.bg} ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>

                {table.activeOrders > 0 && (
                  <p className="mb-3 text-xs text-muted-foreground">
                    {table.activeOrders} pedido
                    {table.activeOrders > 1 ? 's' : ''} activo
                    {table.activeOrders > 1 ? 's' : ''}
                  </p>
                )}

                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() =>
                      setShowQR(showQR === table.id ? null : table.id)
                    }
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-xs font-medium hover:bg-muted active:scale-[0.97]"
                  >
                    <QrCode className="h-3 w-3" /> QR
                  </button>
                  <button
                    onClick={() => openEditDialog(table)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-xs font-medium hover:bg-muted active:scale-[0.97]"
                  >
                    <Pencil className="h-3 w-3" /> Editar
                  </button>
                  <button
                    onClick={() => setTableToDelete(table)}
                    className="rounded-lg border px-3 py-2 text-xs hover:bg-muted active:scale-[0.97]"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                  <button className="rounded-lg border px-3 py-2 text-xs hover:bg-muted active:scale-[0.97]">
                    {table.serviceStatus === 'free' ? (
                      <WifiOff className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <Wifi className="h-3 w-3 text-accent" />
                    )}
                  </button>
                </div>

                {showQR === table.id && (
                  <div className="mt-3 animate-scale-in rounded-xl bg-muted p-4 text-center">
                    <QrPreview value={table.qrCode} />
                    <p className="text-xs font-mono text-muted-foreground">
                      {table.qrCode}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground/60">
                      Escanear para acceder al menú
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={resetFormDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingTable ? 'Editar mesa' : 'Nueva mesa'}
            </DialogTitle>
            <DialogDescription>
              {editingTable
                ? 'Ajusta los datos operativos y el QR público de la mesa.'
                : 'Crea una nueva mesa para el restaurante. Si no envías QR, el backend generará una URL pública automáticamente.'}
            </DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="table-number">Número</Label>
                <Input
                  id="table-number"
                  type="number"
                  min={1}
                  value={formState.number}
                  onChange={handleFormChange('number')}
                  placeholder="12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="table-capacity">Capacidad</Label>
                <Input
                  id="table-capacity"
                  type="number"
                  min={1}
                  value={formState.capacity}
                  onChange={handleFormChange('capacity')}
                  placeholder="4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="table-name">Nombre</Label>
              <Input
                id="table-name"
                value={formState.name}
                onChange={handleFormChange('name')}
                placeholder="Mesa 12"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="table-zone">Zona</Label>
                <Input
                  id="table-zone"
                  value={formState.zone}
                  onChange={handleFormChange('zone')}
                  placeholder="Interior"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="table-status">Estado de servicio</Label>
                <select
                  id="table-status"
                  value={formState.serviceStatus}
                  onChange={handleFormChange('serviceStatus')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {editableStatuses.map((status) => (
                    <option key={status} value={status}>
                      {statusConfig[status].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="table-active-orders">Pedidos activos</Label>
                <Input
                  id="table-active-orders"
                  type="number"
                  min={0}
                  value={formState.activeOrders}
                  onChange={handleFormChange('activeOrders')}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="table-qr">QR público</Label>
                <Input
                  id="table-qr"
                  value={formState.qrCode}
                  onChange={handleFormChange('qrCode')}
                  placeholder="Opcional: dejar vacío para generar"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => resetFormDialog(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Guardando...'
                  : editingTable
                    ? 'Guardar cambios'
                    : 'Crear mesa'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!tableToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setTableToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar mesa</AlertDialogTitle>
            <AlertDialogDescription>
              {tableToDelete
                ? `Se desactivará ${tableToDelete.name}. Esta acción la oculta del módulo, pero mantiene el registro en backend.`
                : 'Se desactivará la mesa seleccionada.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTableMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTableMutation.isPending || !tableToDelete}
              onClick={() => {
                if (!tableToDelete) {
                  return;
                }

                deleteTableMutation.mutate(tableToDelete.id);
              }}
            >
              {deleteTableMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
