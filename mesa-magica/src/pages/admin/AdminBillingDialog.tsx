import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock3, CreditCard } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  closeDiningSessionRequest,
  getDiningSessionAccountRequest,
  markDiningSessionPaymentPendingRequest,
  reopenDiningSessionRequest,
  type DiningSessionAccountStatus,
} from '@/services/diningSessionService';
import {
  cancelPaymentRequest,
  createPaymentRequest,
  getPaymentsBySessionRequest,
  type PaymentMethod,
} from '@/services/paymentService';
import { createFiscalDocumentRequest } from '@/services/fiscalDocumentService';
import { createReceiptRequest } from '@/services/receiptService';

type PaymentForm = {
  method: PaymentMethod;
  amount: string;
  tipAmount: string;
  receivedAmount: string;
  payerName: string;
  reference: string;
  notes: string;
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

const accountStatusConfig: Record<
  DiningSessionAccountStatus,
  { label: string; badgeClassName: string }
> = {
  open: { label: 'Abierta', badgeClassName: 'bg-muted text-muted-foreground' },
  'payment-pending': {
    label: 'Por cobrar',
    badgeClassName: 'bg-status-pending/10 text-status-pending',
  },
  paid: {
    label: 'Pagada',
    badgeClassName: 'bg-status-ready/10 text-status-ready',
  },
  closed: { label: 'Cerrada', badgeClassName: 'bg-accent/10 text-accent' },
};

const emptyPaymentForm: PaymentForm = {
  method: 'cash',
  amount: '',
  tipAmount: '0',
  receivedAmount: '',
  payerName: '',
  reference: '',
  notes: '',
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

interface AdminBillingDialogProps {
  open: boolean;
  sessionToken: string | null;
  actorEmail?: string;
  onOpenChange: (open: boolean) => void;
  onBillingUpdated: () => void;
}

export default function AdminBillingDialog({
  open,
  sessionToken,
  actorEmail,
  onOpenChange,
  onBillingUpdated,
}: AdminBillingDialogProps) {
  const queryClient = useQueryClient();
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(emptyPaymentForm);
  const [billingNote, setBillingNote] = useState('');

  const accountQuery = useQuery({
    queryKey: ['admin', 'dining-session', sessionToken, 'account'],
    queryFn: () => getDiningSessionAccountRequest(sessionToken as string),
    enabled: open && !!sessionToken,
  });

  const paymentsQuery = useQuery({
    queryKey: ['admin', 'payments', sessionToken],
    queryFn: () => getPaymentsBySessionRequest(sessionToken as string),
    enabled: open && !!sessionToken,
  });

  const refreshBilling = () => {
    if (!sessionToken) {
      return;
    }

    void queryClient.invalidateQueries({
      queryKey: ['admin', 'dining-session', sessionToken, 'account'],
    });
    void queryClient.invalidateQueries({
      queryKey: ['admin', 'payments', sessionToken],
    });
    onBillingUpdated();
  };

  const createPayment = useMutation({
    mutationFn: createPaymentRequest,
    onSuccess: () => {
      setPaymentForm(emptyPaymentForm);
      refreshBilling();
      toast({ title: 'Pago registrado' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo registrar el pago',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });

  const cancelPayment = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      cancelPaymentRequest(id, {
        notes: `Pago cancelado por ${actorEmail ?? 'admin'}.`,
      }),
    onSuccess: () => {
      refreshBilling();
      toast({ title: 'Pago cancelado' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo cancelar el pago',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });

  const markPaymentPending = useMutation({
    mutationFn: markDiningSessionPaymentPendingRequest,
    onSuccess: () => {
      refreshBilling();
      toast({ title: 'Cuenta marcada por cobrar' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo actualizar la cuenta',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });

  const closeSession = useMutation({
    mutationFn: (token: string) =>
      closeDiningSessionRequest(token, {
        closedBy: actorEmail ?? 'admin',
        notes: billingNote,
      }),
    onSuccess: () => {
      setBillingNote('');
      refreshBilling();
      toast({ title: 'Cuenta cerrada' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo cerrar la cuenta',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });

  const reopenSession = useMutation({
    mutationFn: (token: string) =>
      reopenDiningSessionRequest(token, {
        reopenedBy: actorEmail ?? 'admin',
        reason: billingNote,
      }),
    onSuccess: () => {
      setBillingNote('');
      refreshBilling();
      toast({ title: 'Cuenta reabierta' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo reabrir la cuenta',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });

  const createReceipt = useMutation({
    mutationFn: createReceiptRequest,
    onSuccess: (receipt) => {
      refreshBilling();
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(receipt.printableHtml);
        printWindow.document.close();
      }
      toast({ title: 'Comprobante emitido' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo emitir el comprobante',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });

  const createFiscalDocument = useMutation({
    mutationFn: createFiscalDocumentRequest,
    onSuccess: () => {
      refreshBilling();
      toast({ title: 'Documento fiscal registrado' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo registrar el documento fiscal',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });

  const submitPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!sessionToken) {
      return;
    }

    createPayment.mutate({
      sessionToken,
      method: paymentForm.method,
      amount: Number(paymentForm.amount),
      tipAmount: Number(paymentForm.tipAmount || 0),
      receivedAmount: paymentForm.receivedAmount
        ? Number(paymentForm.receivedAmount)
        : undefined,
      payerName: paymentForm.payerName,
      reference: paymentForm.reference,
      notes: paymentForm.notes,
    });
  };

  const account = accountQuery.data ?? null;
  const payments = paymentsQuery.data ?? [];

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setPaymentForm(emptyPaymentForm);
          setBillingNote('');
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Cobro y cierre de cuenta</DialogTitle>
          <DialogDescription>
            Registra pagos parciales, propina, vuelto y controla el cierre o reapertura de la sesion.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto pr-2">
          {accountQuery.isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Cargando cuenta...
            </p>
          )}

          {accountQuery.error && (
            <Alert className="border-destructive/30 bg-destructive/5">
              <AlertTitle>No se pudo cargar la cuenta</AlertTitle>
              <AlertDescription>
                {accountQuery.error instanceof Error
                  ? accountQuery.error.message
                  : 'Error inesperado.'}
              </AlertDescription>
            </Alert>
          )}

          {account && (
            <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">Mesa</p>
                <p className="mt-2 font-medium">
                  {account.table?.name ?? 'Mesa no determinada'}
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">Sesion</p>
                <p className="mt-2 break-all text-sm font-medium">
                  {account.sessionToken}
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">Estado</p>
                <span
                  className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${accountStatusConfig[account.accountStatus].badgeClassName}`}
                >
                  {accountStatusConfig[account.accountStatus].label}
                </span>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs text-muted-foreground">Pedidos</p>
                <p className="mt-2 font-medium">{account.orderCount}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Total cuenta</p>
                <p className="mt-2 font-display text-lg">
                  {formatMoney(account.totalAccount)}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Pagado</p>
                <p className="mt-2 font-display text-lg">
                  {formatMoney(account.paidAmount)}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className="mt-2 font-display text-lg">
                  {formatMoney(account.balanceDue)}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Propina</p>
                <p className="mt-2 font-display text-lg">
                  {formatMoney(account.tipAmount)}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Vuelto</p>
                <p className="mt-2 font-display text-lg">
                  {formatMoney(account.changeAmount)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div className="rounded-xl border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Registrar pago</h3>
                  </div>

                  <form className="grid gap-4" onSubmit={submitPayment}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="payment-method">Metodo</Label>
                        <select
                          id="payment-method"
                          value={paymentForm.method}
                          onChange={(event) =>
                            setPaymentForm((current) => ({
                              ...current,
                              method: event.target.value as PaymentMethod,
                            }))
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          {Object.entries(paymentMethodLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment-payer">Pagador</Label>
                        <Input
                          id="payment-payer"
                          value={paymentForm.payerName}
                          onChange={(event) =>
                            setPaymentForm((current) => ({
                              ...current,
                              payerName: event.target.value,
                            }))
                          }
                          placeholder="Ej. Ana / Cuenta 1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="payment-amount">Monto aplicado</Label>
                        <Input
                          id="payment-amount"
                          type="number"
                          min="0"
                          step="1"
                          value={paymentForm.amount}
                          onChange={(event) =>
                            setPaymentForm((current) => ({
                              ...current,
                              amount: event.target.value,
                            }))
                          }
                          placeholder="12000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment-tip">Propina</Label>
                        <Input
                          id="payment-tip"
                          type="number"
                          min="0"
                          step="1"
                          value={paymentForm.tipAmount}
                          onChange={(event) =>
                            setPaymentForm((current) => ({
                              ...current,
                              tipAmount: event.target.value,
                            }))
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="payment-received">Recibido</Label>
                        <Input
                          id="payment-received"
                          type="number"
                          min="0"
                          step="1"
                          value={paymentForm.receivedAmount}
                          onChange={(event) =>
                            setPaymentForm((current) => ({
                              ...current,
                              receivedAmount: event.target.value,
                            }))
                          }
                          placeholder={
                            paymentForm.method === 'cash'
                              ? 'Solo si necesitas vuelto'
                              : 'Opcional'
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="payment-reference">Referencia</Label>
                        <Input
                          id="payment-reference"
                          value={paymentForm.reference}
                          onChange={(event) =>
                            setPaymentForm((current) => ({
                              ...current,
                              reference: event.target.value,
                            }))
                          }
                          placeholder="Voucher, caja, transferencia"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billing-note">Nota operativa</Label>
                        <Input
                          id="billing-note"
                          value={billingNote}
                          onChange={(event) => setBillingNote(event.target.value)}
                          placeholder="Se usa para cierre o reapertura"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="payment-notes">Observaciones del pago</Label>
                      <Textarea
                        id="payment-notes"
                        value={paymentForm.notes}
                        onChange={(event) =>
                          setPaymentForm((current) => ({
                            ...current,
                            notes: event.target.value,
                          }))
                        }
                        placeholder="Cuenta dividida, pago parcial, detalle de caja..."
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" disabled={createPayment.isPending}>
                        {createPayment.isPending ? 'Registrando...' : 'Registrar pago'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!sessionToken || createReceipt.isPending}
                        onClick={() =>
                          sessionToken &&
                          createReceipt.mutate({
                            sessionToken,
                            type: 'prebill',
                          })
                        }
                      >
                        Pre-cuenta
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={markPaymentPending.isPending || !sessionToken}
                        onClick={() =>
                          sessionToken && markPaymentPending.mutate(sessionToken)
                        }
                      >
                        Marcar por cobrar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={
                          closeSession.isPending ||
                          !sessionToken ||
                          account.balanceDue > 0 ||
                          account.accountStatus === 'closed'
                        }
                        onClick={() => sessionToken && closeSession.mutate(sessionToken)}
                      >
                        {closeSession.isPending ? 'Cerrando...' : 'Cerrar cuenta'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={
                          reopenSession.isPending ||
                          !sessionToken ||
                          account.accountStatus !== 'closed'
                        }
                        onClick={() => sessionToken && reopenSession.mutate(sessionToken)}
                      >
                        {reopenSession.isPending ? 'Reabriendo...' : 'Reabrir cuenta'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={!sessionToken || createFiscalDocument.isPending}
                        onClick={() =>
                          sessionToken &&
                          createFiscalDocument.mutate({
                            sessionToken,
                            documentType: 'receipt',
                          })
                        }
                      >
                        Registrar documento fiscal
                      </Button>
                    </div>
                  </form>
                </div>

                <div className="rounded-xl border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Detalle de pedidos en la cuenta</h3>
                  </div>

                  <div className="space-y-3">
                    {account.orders.map((order) => (
                      <div key={order.id} className="rounded-xl border bg-muted/20 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium">Pedido #{order.number}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(order.createdAt)}
                            </p>
                          </div>
                          <p className="font-medium">{formatMoney(order.total)}</p>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {order.items
                            .map((item) => `${item.quantity}x ${item.productName}`)
                            .join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <h3 className="font-medium">Pagos registrados</h3>
                {paymentsQuery.isLoading ? (
                  <p className="mt-4 text-sm text-muted-foreground">Cargando pagos...</p>
                ) : payments.length ? (
                  <div className="mt-4 space-y-3">
                    {payments.map((payment) => (
                      <div key={payment.id} className="rounded-xl border bg-muted/20 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">
                              {paymentMethodLabels[payment.method]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(payment.paidAt)}
                            </p>
                          </div>
                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                              payment.paymentStatus === 'cancelled'
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-status-ready/10 text-status-ready'
                            }`}
                          >
                            {payment.paymentStatus === 'cancelled'
                              ? 'Cancelado'
                              : 'Pagado'}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <p>Monto: {formatMoney(payment.amount)}</p>
                          <p>Propina: {formatMoney(payment.tipAmount)}</p>
                          <p>Recibido: {formatMoney(payment.receivedAmount)}</p>
                          <p>Vuelto: {formatMoney(payment.changeAmount)}</p>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {payment.payerName || 'Sin pagador'} · {payment.reference || 'Sin referencia'} · {payment.createdBy}
                        </p>
                        <p className="mt-2 text-sm">
                          {payment.notes || 'Sin observaciones.'}
                        </p>
                        {payment.paymentStatus !== 'cancelled' &&
                          account.accountStatus !== 'closed' && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="mt-3"
                              disabled={cancelPayment.isPending}
                              onClick={() => cancelPayment.mutate({ id: payment.id })}
                            >
                              Cancelar pago
                            </Button>
                          )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Aun no hay pagos registrados para esta cuenta.
                  </p>
                )}
              </div>
            </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
