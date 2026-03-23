import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart, AlertTriangle } from 'lucide-react';
import { products } from '@/data/mockData';
import { useApp } from '@/context/AppContext';

export default function ClientProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useApp();
  const product = products.find(p => p.id === id);

  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<{ extraId: string; value: string }[]>([]);
  const [notes, setNotes] = useState('');

  if (!product) return <div className="p-6 text-center">Producto no encontrado</div>;

  const toggleExtra = (extraId: string, value: string) => {
    setSelectedExtras(prev => {
      const existing = prev.find(e => e.extraId === extraId);
      if (existing) {
        if (existing.value === value) return prev.filter(e => e.extraId !== extraId);
        return prev.map(e => e.extraId === extraId ? { ...e, value } : e);
      }
      return [...prev, { extraId, value }];
    });
  };

  const extrasTotal = selectedExtras.reduce((s, e) => {
    const extra = product.extras.find(x => x.id === e.extraId);
    return s + (extra?.price || 0);
  }, 0);

  const total = (product.price + extrasTotal) * quantity;

  const handleAdd = () => {
    addToCart(product, quantity, selectedExtras, notes);
    navigate('/cliente/menu');
  };

  return (
    <div className="animate-fade-in">
      {/* Image */}
      <div className={`relative h-56 bg-gradient-to-br ${product.gradient} flex items-center justify-center`}>
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 w-10 h-10 rounded-full bg-card/90 backdrop-blur flex items-center justify-center shadow-md active:scale-[0.95]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-8xl">{product.image}</span>
      </div>

      <div className="px-5 py-5 -mt-4 bg-background rounded-t-3xl relative">
        {product.promo && (
          <span className="inline-block bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full mb-2">Promoción</span>
        )}
        <h1 className="font-display text-2xl mb-1">{product.name}</h1>
        <p className="font-display text-primary text-2xl mb-4">S/ {product.price}</p>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">{product.description}</p>

        {/* Allergens */}
        {product.allergens.length > 0 && (
          <div className="flex items-start gap-2 bg-destructive/8 border border-destructive/15 rounded-xl p-3 mb-5">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-destructive mb-0.5">Alérgenos</p>
              <p className="text-xs text-muted-foreground">{product.allergens.join(', ')}</p>
            </div>
          </div>
        )}

        {/* Extras */}
        {product.extras.length > 0 && (
          <div className="mb-5">
            <h3 className="font-semibold text-sm mb-3">Personalizar</h3>
            <div className="space-y-2">
              {product.extras.map(extra => (
                <div key={extra.id}>
                  {extra.type === 'choice' && extra.options ? (
                    <div className="bg-muted rounded-xl p-3">
                      <p className="text-sm font-medium mb-2">{extra.name}</p>
                      <div className="flex flex-wrap gap-2">
                        {extra.options.map(opt => {
                          const isSelected = selectedExtras.some(e => e.extraId === extra.id && e.value === opt);
                          return (
                            <button
                              key={opt}
                              onClick={() => toggleExtra(extra.id, opt)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.96] ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-card border text-foreground'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => toggleExtra(extra.id, extra.name)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition-all active:scale-[0.98] ${
                        selectedExtras.some(e => e.extraId === extra.id)
                          ? 'bg-primary/10 border-primary/30 border'
                          : 'bg-muted'
                      }`}
                    >
                      <span>{extra.name}</span>
                      {extra.price > 0 && <span className="text-primary font-medium">+S/ {extra.price}</span>}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mb-5">
          <h3 className="font-semibold text-sm mb-2">Notas especiales</h3>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ej: Sin sal, sin gluten, alergia a frutos secos..."
            className="w-full p-3 rounded-xl bg-muted text-sm placeholder:text-muted-foreground/50 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Quantity */}
        <div className="flex items-center justify-between mb-6">
          <span className="font-semibold text-sm">Cantidad</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-xl border flex items-center justify-center hover:bg-muted active:scale-[0.95]"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-semibold text-lg tabular-nums w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 active:scale-[0.95]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Add button */}
        <button
          onClick={handleAdd}
          disabled={!product.available}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-xl transition-all active:scale-[0.97] disabled:opacity-50"
        >
          <ShoppingCart className="w-5 h-5" />
          Agregar · S/ {total.toFixed(2)}
        </button>
      </div>
    </div>
  );
}
