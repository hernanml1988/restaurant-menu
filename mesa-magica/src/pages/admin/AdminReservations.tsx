import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  createReservationRequest,
  deactivateReservationRequest,
  getReservationsRequest,
  updateReservationRequest,
  type ReservationRecord,
  type ReservationStatus,
} from '@/services/reservationService';
import { getTablesRequest } from '@/services/tableService';

const reservationStatuses: ReservationStatus[] = [
  'booked',
  'confirmed',
  'seated',
  'completed',
  'cancelled',
  'no-show',
];

const statusLabels: Record<ReservationStatus, string> = {
  booked: 'Reservada',
  confirmed: 'Confirmada',
  seated: 'Sentada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  'no-show': 'No asistio',
};

export default function AdminReservations() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    partySize: '2',
    reservationAt: '',
    reservationStatus: 'booked' as ReservationStatus,
    notes: '',
    tableId: '',
  });

  const reservationsQuery = useQuery({
    queryKey: ['admin', 'reservations'],
    queryFn: getReservationsRequest,
  });

  const tablesQuery = useQuery({
    queryKey: ['admin', 'tables'],
    queryFn: getTablesRequest,
  });

  const reservations = useMemo(
    () => reservationsQuery.data ?? [],
    [reservationsQuery.data],
  );

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'reservations'] });
  };

  const createReservation = useMutation({
    mutationFn: createReservationRequest,
    onSuccess: () => {
      setForm({
        guestName: '',
        guestPhone: '',
        guestEmail: '',
        partySize: '2',
        reservationAt: '',
        reservationStatus: 'booked',
        notes: '',
        tableId: '',
      });
      refresh();
      toast({ title: 'Reserva creada' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo crear la reserva',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });

  const updateReservation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: ReservationStatus;
    }) => updateReservationRequest(id, { reservationStatus: status }),
    onSuccess: () => {
      refresh();
      toast({ title: 'Reserva actualizada' });
    },
  });

  const removeReservation = useMutation({
    mutationFn: deactivateReservationRequest,
    onSuccess: () => {
      refresh();
      toast({ title: 'Reserva desactivada' });
    },
  });

  const submitReservation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.guestName.trim() || !form.reservationAt) {
      toast({
        title: 'Faltan datos',
        description: 'Completa cliente y fecha de reserva.',
        variant: 'destructive',
      });
      return;
    }

    createReservation.mutate({
      guestName: form.guestName,
      guestPhone: form.guestPhone,
      guestEmail: form.guestEmail,
      partySize: Number(form.partySize),
      reservationAt: new Date(form.reservationAt).toISOString(),
      reservationStatus: form.reservationStatus,
      notes: form.notes,
      tableId: form.tableId || undefined,
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="mb-1 font-display text-3xl">Reservas</h1>
        <p className="text-muted-foreground">
          Agenda mesas, confirma asistencia y sigue el estado de recepcion.
        </p>
      </div>

      {reservationsQuery.error && (
        <Alert className="border-destructive/30 bg-destructive/5">
          <AlertTitle>No se pudieron cargar las reservas</AlertTitle>
          <AlertDescription>
            {reservationsQuery.error instanceof Error
              ? reservationsQuery.error.message
              : 'Error inesperado.'}
          </AlertDescription>
        </Alert>
      )}

      <section className="rounded-2xl border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl">Nueva reserva</h2>
        </div>

        <form className="grid gap-4" onSubmit={submitReservation}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reservation-name">Cliente</Label>
              <Input
                id="reservation-name"
                value={form.guestName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, guestName: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reservation-party-size">Comensales</Label>
              <Input
                id="reservation-party-size"
                type="number"
                min="1"
                value={form.partySize}
                onChange={(event) =>
                  setForm((current) => ({ ...current, partySize: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="reservation-phone">Telefono</Label>
              <Input
                id="reservation-phone"
                value={form.guestPhone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, guestPhone: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reservation-email">Email</Label>
              <Input
                id="reservation-email"
                type="email"
                value={form.guestEmail}
                onChange={(event) =>
                  setForm((current) => ({ ...current, guestEmail: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reservation-date">Fecha y hora</Label>
              <Input
                id="reservation-date"
                type="datetime-local"
                value={form.reservationAt}
                onChange={(event) =>
                  setForm((current) => ({ ...current, reservationAt: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reservation-table">Mesa</Label>
              <select
                id="reservation-table"
                value={form.tableId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, tableId: event.target.value }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Asignar despues</option>
                {(tablesQuery.data ?? []).map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reservation-status">Estado</Label>
              <select
                id="reservation-status"
                value={form.reservationStatus}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    reservationStatus: event.target.value as ReservationStatus,
                  }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {reservationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reservation-notes">Notas</Label>
            <Textarea
              id="reservation-notes"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </div>

          <div>
            <Button type="submit" disabled={createReservation.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              {createReservation.isPending ? 'Guardando...' : 'Crear reserva'}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border bg-card">
        <div className="border-b p-5">
          <h2 className="font-display text-2xl">Agenda actual</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Mesa
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Estado
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation: ReservationRecord) => (
                <tr key={reservation.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{reservation.guestName}</p>
                      <p className="text-xs text-muted-foreground">
                        {reservation.partySize} personas
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {new Intl.DateTimeFormat('es-CL', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(reservation.reservationAt))}
                  </td>
                  <td className="px-4 py-3">
                    {reservation.table?.name ?? 'Sin asignar'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={reservation.reservationStatus}
                      onChange={(event) =>
                        updateReservation.mutate({
                          id: reservation.id,
                          status: event.target.value as ReservationStatus,
                        })
                      }
                      className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                    >
                      {reservationStatuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="rounded-lg p-2 hover:bg-muted"
                      onClick={() => removeReservation.mutate(reservation.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </td>
                </tr>
              ))}
              {!reservations.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No hay reservas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
