import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Receipt, Scale, ShieldCheck, Wallet } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { getAuditLogsRequest } from '@/services/auditLogService';
import {
  closeCashSessionRequest,
  getCashSessionHistoryRequest,
  getCurrentCashSessionRequest,
  openCashSessionRequest,
} from '@/services/cashSessionService';
import {
  createFiscalDocumentRequest,
  getFiscalDocumentsRequest,
} from '@/services/fiscalDocumentService';
import { getReceiptsRequest } from '@/services/receiptService';

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default function AdminOperations() {
  const queryClient = useQueryClient();
  const [openCash, setOpenCash] = useState({ openingAmount: '', notes: '' });
  const [closeCash, setCloseCash] = useState({ closingAmount: '', notes: '' });
  const [fiscalForm, setFiscalForm] = useState({
    sessionToken: '',
    documentType: 'receipt' as 'receipt' | 'invoice',
  });

  const currentCashQuery = useQuery({
    queryKey: ['admin', 'cash-session', 'current'],
    queryFn: getCurrentCashSessionRequest,
  });
  const cashHistoryQuery = useQuery({
    queryKey: ['admin', 'cash-session', 'history'],
    queryFn: getCashSessionHistoryRequest,
  });
  const receiptsQuery = useQuery({
    queryKey: ['admin', 'receipts'],
    queryFn: getReceiptsRequest,
  });
  const fiscalDocumentsQuery = useQuery({
    queryKey: ['admin', 'fiscal-documents'],
    queryFn: getFiscalDocumentsRequest,
  });
  const auditLogsQuery = useQuery({
    queryKey: ['admin', 'audit-logs'],
    queryFn: () => getAuditLogsRequest(30),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'cash-session'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'receipts'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'fiscal-documents'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
  };

  const openCashMutation = useMutation({
    mutationFn: openCashSessionRequest,
    onSuccess: () => {
      refresh();
      setOpenCash({ openingAmount: '', notes: '' });
      toast({ title: 'Caja abierta' });
    },
  });

  const closeCashMutation = useMutation({
    mutationFn: closeCashSessionRequest,
    onSuccess: () => {
      refresh();
      setCloseCash({ closingAmount: '', notes: '' });
      toast({ title: 'Caja cerrada' });
    },
  });

  const createFiscalDocument = useMutation({
    mutationFn: createFiscalDocumentRequest,
    onSuccess: () => {
      refresh();
      setFiscalForm({ sessionToken: '', documentType: 'receipt' });
      toast({ title: 'Documento fiscal registrado' });
    },
  });

  const currentCash = currentCashQuery.data;
  const cashHistory = useMemo(
    () => cashHistoryQuery.data ?? [],
    [cashHistoryQuery.data],
  );
  const receipts = useMemo(() => receiptsQuery.data ?? [], [receiptsQuery.data]);
  const fiscalDocuments = useMemo(
    () => fiscalDocumentsQuery.data ?? [],
    [fiscalDocumentsQuery.data],
  );
  const auditLogs = useMemo(() => auditLogsQuery.data ?? [], [auditLogsQuery.data]);

  const submitOpenCash = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    openCashMutation.mutate({
      openingAmount: Number(openCash.openingAmount),
      notes: openCash.notes,
    });
  };

  const submitCloseCash = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    closeCashMutation.mutate({
      closingAmount: Number(closeCash.closingAmount),
      notes: closeCash.notes,
    });
  };

  const submitFiscal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createFiscalDocument.mutate({
      sessionToken: fiscalForm.sessionToken,
      documentType: fiscalForm.documentType,
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="mb-1 font-display text-3xl">Operaciones</h1>
        <p className="text-muted-foreground">
          Caja, comprobantes, fiscalizacion interna y trazabilidad reciente.
        </p>
      </div>

      {(currentCashQuery.error ||
        cashHistoryQuery.error ||
        receiptsQuery.error ||
        fiscalDocumentsQuery.error ||
        auditLogsQuery.error) && (
        <Alert className="border-destructive/30 bg-destructive/5">
          <AlertTitle>No se pudo cargar una parte del modulo operativo</AlertTitle>
          <AlertDescription>
            Verifica la sesion activa y el backend.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl">Caja</h2>
            </div>

            {currentCash ? (
              <div className="mb-5 rounded-xl border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Caja abierta</p>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Apertura</p>
                    <p className="font-medium">{formatMoney(currentCash.openingAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Esperado</p>
                    <p className="font-medium">{formatMoney(currentCash.expectedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Abierta por</p>
                    <p className="font-medium">{currentCash.openedBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Desde</p>
                    <p className="font-medium">
                      {new Intl.DateTimeFormat('es-CL', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(currentCash.openedAt))}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <form className="space-y-3 rounded-xl border p-4" onSubmit={submitOpenCash}>
                <h3 className="font-medium">Abrir caja</h3>
                <div className="space-y-2">
                  <Label htmlFor="cash-opening">Monto inicial</Label>
                  <Input
                    id="cash-opening"
                    type="number"
                    min="0"
                    value={openCash.openingAmount}
                    onChange={(event) =>
                      setOpenCash((current) => ({
                        ...current,
                        openingAmount: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cash-opening-notes">Notas</Label>
                  <Textarea
                    id="cash-opening-notes"
                    value={openCash.notes}
                    onChange={(event) =>
                      setOpenCash((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </div>
                <Button type="submit" disabled={openCashMutation.isPending || !!currentCash}>
                  Abrir caja
                </Button>
              </form>

              <form className="space-y-3 rounded-xl border p-4" onSubmit={submitCloseCash}>
                <h3 className="font-medium">Cerrar caja</h3>
                <div className="space-y-2">
                  <Label htmlFor="cash-closing">Monto contado</Label>
                  <Input
                    id="cash-closing"
                    type="number"
                    min="0"
                    value={closeCash.closingAmount}
                    onChange={(event) =>
                      setCloseCash((current) => ({
                        ...current,
                        closingAmount: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cash-closing-notes">Notas</Label>
                  <Textarea
                    id="cash-closing-notes"
                    value={closeCash.notes}
                    onChange={(event) =>
                      setCloseCash((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </div>
                <Button type="submit" disabled={closeCashMutation.isPending || !currentCash}>
                  Cerrar caja
                </Button>
              </form>
            </div>

            <div className="mt-5 space-y-2">
              <h3 className="font-medium">Historial reciente</h3>
              {cashHistory.slice(0, 5).map((session) => (
                <div key={session.id} className="rounded-xl border bg-muted/20 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span>{session.sessionStatus === 'open' ? 'Abierta' : 'Cerrada'}</span>
                    <span className="font-medium">{formatMoney(session.expectedAmount)}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {session.openedBy} • {new Date(session.openedAt).toLocaleString('es-CL')}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl">Fiscalizacion documental</h2>
            </div>

            <form className="grid gap-4 sm:grid-cols-[1fr_180px_auto]" onSubmit={submitFiscal}>
              <Input
                placeholder="Session token"
                value={fiscalForm.sessionToken}
                onChange={(event) =>
                  setFiscalForm((current) => ({
                    ...current,
                    sessionToken: event.target.value,
                  }))
                }
              />
              <select
                value={fiscalForm.documentType}
                onChange={(event) =>
                  setFiscalForm((current) => ({
                    ...current,
                    documentType: event.target.value as 'receipt' | 'invoice',
                  }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="receipt">Boleta interna</option>
                <option value="invoice">Factura interna</option>
              </select>
              <Button type="submit" disabled={createFiscalDocument.isPending}>
                Emitir
              </Button>
            </form>

            <div className="mt-5 space-y-3">
              {fiscalDocuments.slice(0, 8).map((document) => (
                <div key={document.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{document.folio}</p>
                      <p className="text-xs text-muted-foreground">
                        {document.documentType} • {document.issuedBy}
                      </p>
                    </div>
                    <span className="font-medium">{formatMoney(document.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl">Comprobantes</h2>
            </div>
            <div className="space-y-3">
              {receipts.slice(0, 8).map((receipt) => (
                <div key={receipt.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{receipt.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {receipt.type} • {receipt.issuedBy}
                      </p>
                    </div>
                    <span className="font-medium">{formatMoney(receipt.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl">Bitacora reciente</h2>
            </div>
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.actor} • {log.entityType}
                      </p>
                    </div>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat('es-CL', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(new Date(log.createdAt))}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
