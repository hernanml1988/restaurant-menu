import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { RESTAURANT } from '@/data/mockData';

export default function ClientCart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart, setOrderPlaced } = useApp();
  const [observations, setObservations] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="font-display text-xl mb-2">Tu carrito está vacío</h2>
        <p className="text-sm text-muted-foreground mb-6">Explora nuestro menú y agrega lo que se te antoje</p>
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
    setOrderPlaced(true);
    clearCart();
    navigate('/cliente/confirmacion');
  };

  return (
    <div className="px-4 pt-5 animate-fade-in">
      <h1 className="font-display text-2xl mb-1">Tu pedido</h1>
      <p className="text-sm text-muted-foreground mb-5">{RESTAURANT.currentTable} · {cart.length} {cart.length === 1 ? 'producto' : 'productos'}</p>

      <div className="space-y-3 mb-5">
        {cart.map((item, i) => (
          <div key={i} className="bg-card border rounded-2xl p-4 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex gap-3">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.product.gradient} flex items-center justify-center text-2xl shrink-0`}>
                {item.product.image}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{item.product.name}</h3>
                {item.selectedExtras.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.selectedExtras.map(e => e.value).join(', ')}
                  </p>
                )}
                {item.notes && <p className="text-xs text-muted-foreground italic mt-0.5">"{item.notes}"</p>}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => item.quantity > 1 ? updateQuantity(i, item.quantity - 1) : removeFromCart(i)} className="w-7 h-7 rounded-lg border flex items-center justify-center active:scale-[0.95]">
                      {item.quantity === 1 ? <Trash2 className="w-3 h-3 text-destructive" /> : <Minus className="w-3 h-3" />}
                    </button>
                    <span className="text-sm font-medium tabular-nums w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(i, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center active:scale-[0.95]">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-display text-primary">S/ {(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Observations */}
      <div className="mb-5">
        <h3 className="font-semibold text-sm mb-2">Observaciones generales</h3>
        <textarea
          value={observations}
          onChange={e => setObservations(e.target.value)}
          placeholder="Indicaciones especiales para la cocina..."
          className="w-full p-3 rounded-xl bg-muted text-sm placeholder:text-muted-foreground/50 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Total */}
      <div className="bg-card border rounded-2xl p-4 mb-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular-nums">S/ {cartTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm mb-3">
          <span className="text-muted-foreground">Servicio (10%)</span>
          <span className="tabular-nums">S/ {(cartTotal * 0.1).toFixed(2)}</span>
        </div>
        <div className="border-t pt-3 flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span className="font-display text-primary tabular-nums">S/ {(cartTotal * 1.1).toFixed(2)}</span>
        </div>
      </div>

      {/* Confirm dialog */}
      {showConfirm ? (
        <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-5 mb-5 animate-scale-in">
          <h3 className="font-semibold mb-2">¿Confirmar pedido?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tu pedido será enviado a cocina inmediatamente. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-xl border font-medium text-sm active:scale-[0.97]">
              Cancelar
            </button>
            <button onClick={handleConfirm} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-lg shadow-primary/25 active:scale-[0.97]">
              Confirmar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-xl transition-all active:scale-[0.97] mb-4"
        >
          Enviar pedido
          <ArrowRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
