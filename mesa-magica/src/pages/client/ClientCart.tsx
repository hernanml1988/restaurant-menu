import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/lib/currency';
import {
  buildClientWelcomePath,
  isClientSessionResetError,
} from '@/lib/clientSession';
import { createPublicOrderRequest } from '@/services/orderService';

export default function ClientCart() {
  const navigate = useNavigate();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    clearCart,
    session,
    setSession,
    setLastSubmittedOrder,
  } = useApp();
  const [observations, setObservations] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const createOrder = useMutation({
    mutationFn: createPublicOrderRequest,
    onSuccess: (order) => {
      setLastSubmittedOrder(order);
      clearCart();
      navigate('/cliente/confirmacion');
    },
    onError: (error) =>
      {
        if (isClientSessionResetError(error)) {
          const redirectPath = buildClientWelcomePath(session?.table?.qrCode);
          setSession(null);
          navigate(redirectPath, { replace: true });
        }

        toast({
          title: 'No se pudo enviar el pedido',
          description: error instanceof Error ? error.message : 'Error inesperado.',
          variant: 'destructive',
        });
      },
  });

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="font-display text-xl mb-2">Tu carrito está vacío</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Explora nuestro menú y agrega lo que se te antoje
        </p>
        <button
          onClick={() => navigate('/cliente/menu')}
          className="bg-primary text-primary-foreground font-medium px-6 py-3 rounded-xl active:scale-[0.97] transition-transform"
        >
          Ver menú
        </button>
      </div>
    );
  }

  const handleConfirm = () => {
    if (!session) {
      toast({
        title: 'Mesa no disponible',
        description: 'Primero debes abrir una sesión desde el QR de la mesa.',
        variant: 'destructive',
      });
      return;
    }

    createOrder.mutate({
      sessionToken: session.sessionToken,
      observations: observations.trim() || undefined,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        notes: item.notes.trim() || undefined,
        extras: item.selectedExtras.map((extra) => ({
          productExtraId: extra.extraId,
          value: extra.value,
        })),
      })),
    });
  };

  return (
    <div className="px-4 pt-5 animate-fade-in">
      <h1 className="font-display text-2xl mb-1">Tu pedido</h1>
      <p className="text-sm text-muted-foreground mb-5">
        {session?.table?.name ?? 'Mesa no determinada'} · {cart.length}{' '}
        {cart.length === 1 ? 'producto' : 'productos'}
      </p>

      {!session && (
        <Alert className="mb-5 border-status-pending/30 bg-status-pending/5">
          <AlertTitle>Sesión requerida</AlertTitle>
          <AlertDescription>
            El carrito está listo, pero necesitas una mesa activa para enviar el pedido.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 mb-5">
        {cart.map((item, index) => {
          const itemExtrasTotal = item.selectedExtras.reduce(
            (sum, extra) => sum + extra.price,
            0,
          );
          const itemTotal = (Number(item.product.price) + itemExtrasTotal) * item.quantity;

          return (
            <div
              key={`${item.product.id}-${index}`}
              className="bg-card border rounded-2xl p-4 animate-slide-up"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex gap-3">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${
                    item.product.gradient || 'from-amber-100 to-orange-100'
                  } flex items-center justify-center text-2xl shrink-0`}
                >
                  {item.product.image || item.product.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{item.product.name}</h3>
                  {item.selectedExtras.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.selectedExtras.map((extra) => extra.value).join(', ')}
                    </p>
                  )}
                  {item.notes && (
                    <p className="text-xs text-muted-foreground italic mt-0.5">
                      "{item.notes}"
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          item.quantity > 1
                            ? updateQuantity(index, item.quantity - 1)
                            : removeFromCart(index)
                        }
                        className="w-7 h-7 rounded-lg border flex items-center justify-center active:scale-[0.95]"
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="w-3 h-3 text-destructive" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                      </button>
                      <span className="text-sm font-medium tabular-nums w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center active:scale-[0.95]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-display text-primary">
                      {formatCurrency(itemTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-5">
        <h3 className="font-semibold text-sm mb-2">Observaciones generales</h3>
        <textarea
          value={observations}
          onChange={(event) => setObservations(event.target.value)}
          placeholder="Indicaciones especiales para la cocina..."
          className="w-full p-3 rounded-xl bg-muted text-sm placeholder:text-muted-foreground/50 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="bg-card border rounded-2xl p-4 mb-5">
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span className="font-display text-primary tabular-nums">
            {formatCurrency(cartTotal)}
          </span>
        </div>
      </div>

      {showConfirm ? (
        <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-5 mb-5 animate-scale-in">
          <h3 className="font-semibold mb-2">¿Confirmar pedido?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tu pedido será enviado a cocina inmediatamente. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-3 rounded-xl border font-medium text-sm active:scale-[0.97]"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={createOrder.isPending}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-lg shadow-primary/25 active:scale-[0.97] disabled:opacity-60"
            >
              {createOrder.isPending ? 'Enviando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={createOrder.isPending}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-xl transition-all active:scale-[0.97] mb-4 disabled:opacity-60"
        >
          Enviar pedido
          <ArrowRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
