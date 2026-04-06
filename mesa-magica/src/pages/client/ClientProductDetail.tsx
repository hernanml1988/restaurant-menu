import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useApp, type CartExtraSelection } from '@/context/AppContext';
import { getPublicProductRequest } from '@/services/productService';

const fallbackGradient = 'from-amber-100 to-orange-100';

export default function ClientProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, session } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<CartExtraSelection[]>([]);
  const [notes, setNotes] = useState('');

  const productQuery = useQuery({
    queryKey: ['client', 'products', id],
    queryFn: () => getPublicProductRequest(id as string),
    enabled: Boolean(id),
  });

  const product = productQuery.data;

  const extrasTotal = useMemo(
    () => selectedExtras.reduce((sum, extra) => sum + extra.price, 0),
    [selectedExtras],
  );
  const total = useMemo(
    () => ((Number(product?.price) || 0) + extrasTotal) * quantity,
    [extrasTotal, product?.price, quantity],
  );

  const toggleExtra = (
    extraId: string,
    name: string,
    value: string,
    price: number,
  ) => {
    setSelectedExtras((currentExtras) => {
      const existingExtra = currentExtras.find((extra) => extra.extraId === extraId);

      if (existingExtra) {
        if (existingExtra.value === value) {
          return currentExtras.filter((extra) => extra.extraId !== extraId);
        }

        return currentExtras.map((extra) =>
          extra.extraId === extraId ? { extraId, name, value, price } : extra,
        );
      }

      return [...currentExtras, { extraId, name, value, price }];
    });
  };

  const handleAdd = () => {
    if (!product) {
      return;
    }

    addToCart(product, quantity, selectedExtras, notes);
    navigate('/cliente/carrito');
  };

  if (productQuery.isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Cargando producto...</div>;
  }

  if (productQuery.error || !product) {
    return (
      <div className="p-6">
        <Alert className="border-destructive/30 bg-destructive/5">
          <AlertTitle>Producto no disponible</AlertTitle>
          <AlertDescription>
            {productQuery.error instanceof Error
              ? productQuery.error.message
              : 'No se pudo obtener el producto.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div
        className={`relative h-56 bg-gradient-to-br ${product.gradient || fallbackGradient} flex items-center justify-center`}
      >
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-card/90 backdrop-blur flex items-center justify-center shadow-md active:scale-[0.95]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-8xl">{product.image || product.name.slice(0, 1).toUpperCase()}</span>
      </div>

      <div className="px-5 py-5 -mt-4 bg-background rounded-t-3xl relative">
        {product.promo && (
          <span className="inline-block bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full mb-2">
            Promoción
          </span>
        )}
        <h1 className="font-display text-2xl mb-1">{product.name}</h1>
        <p className="font-display text-primary text-2xl mb-4">
          ${Number(product.price).toFixed(2)}
        </p>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {product.description}
        </p>

        {!session && (
          <Alert className="mb-5 border-status-pending/30 bg-status-pending/5">
            <AlertTitle>Sesión requerida</AlertTitle>
            <AlertDescription>
              Necesitas una mesa activa para agregar productos al carrito.
            </AlertDescription>
          </Alert>
        )}

        {product.allergens.length > 0 && (
          <div className="flex items-start gap-2 bg-destructive/8 border border-destructive/15 rounded-xl p-3 mb-5">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-destructive mb-0.5">Alérgenos</p>
              <p className="text-xs text-muted-foreground">{product.allergens.join(', ')}</p>
            </div>
          </div>
        )}

        {product.extras.length > 0 && (
          <div className="mb-5">
            <h3 className="font-semibold text-sm mb-3">Personalizar</h3>
            <div className="space-y-2">
              {product.extras
                .filter((extra) => extra.state)
                .map((extra) => (
                  <div key={extra.id}>
                    {extra.type === 'choice' && extra.options.length > 0 ? (
                      <div className="bg-muted rounded-xl p-3">
                        <p className="text-sm font-medium mb-2">{extra.name}</p>
                        <div className="flex flex-wrap gap-2">
                          {extra.options.map((option) => {
                            const isSelected = selectedExtras.some(
                              (selectedExtra) =>
                                selectedExtra.extraId === extra.id &&
                                selectedExtra.value === option,
                            );

                            return (
                              <button
                                key={option}
                                onClick={() =>
                                  toggleExtra(extra.id, extra.name, option, Number(extra.price))
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.96] ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card border text-foreground'
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          toggleExtra(extra.id, extra.name, extra.name, Number(extra.price))
                        }
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition-all active:scale-[0.98] ${
                          selectedExtras.some((selectedExtra) => selectedExtra.extraId === extra.id)
                            ? 'bg-primary/10 border-primary/30 border'
                            : 'bg-muted'
                        }`}
                      >
                        <span>{extra.name}</span>
                        {Number(extra.price) > 0 && (
                          <span className="text-primary font-medium">
                            +${Number(extra.price).toFixed(2)}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="mb-5">
          <h3 className="font-semibold text-sm mb-2">Notas especiales</h3>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ej: Sin sal, sin gluten, alergia a frutos secos..."
            className="w-full p-3 rounded-xl bg-muted text-sm placeholder:text-muted-foreground/50 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

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

        <button
          onClick={handleAdd}
          disabled={!product.available || !session}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-xl transition-all active:scale-[0.97] disabled:opacity-50"
        >
          <ShoppingCart className="w-5 h-5" />
          Agregar · ${total.toFixed(2)}
        </button>
      </div>
    </div>
  );
}
