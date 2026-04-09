import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ShoppingCart, Star } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useApp } from '@/context/AppContext';
import { useRestaurantProfile } from '@/hooks/use-restaurant-profile';
import { formatCurrency } from '@/lib/currency';
import { getPublicCategoriesRequest } from '@/services/categoryService';
import { getPublicProductsRequest } from '@/services/productService';

const fallbackGradient = 'from-amber-100 to-orange-100';

export default function ClientMenu() {
  const navigate = useNavigate();
  const { cartCount, session } = useApp();
  const { profile } = useRestaurantProfile();
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch] = useState('');

  const categoriesQuery = useQuery({
    queryKey: ['client', 'categories'],
    queryFn: getPublicCategoriesRequest,
  });
  const productsQuery = useQuery({
    queryKey: ['client', 'products'],
    queryFn: getPublicProductsRequest,
  });

  const categories = useMemo(
    () => (categoriesQuery.data ?? []).filter((category) => category.state),
    [categoriesQuery.data],
  );
  const products = useMemo(
    () => (productsQuery.data ?? []).filter((product) => product.state),
    [productsQuery.data],
  );

  useEffect(() => {
    if (!categories.length) {
      return;
    }

    const activeCategoryExists = categories.some((category) => category.id === activeCategory);

    if (!activeCategoryExists) {
      setActiveCategory(categories[0].id);
    }
  }, [activeCategory, categories]);

  const filtered = useMemo(() => {
    let list = products.filter((product) =>
      activeCategory ? product.category?.id === activeCategory : true,
    );

    if (search.trim()) {
      const query = search.toLowerCase();
      list = products.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query),
      );
    }

    return list;
  }, [activeCategory, products, search]);

  const loading = categoriesQuery.isLoading || productsQuery.isLoading;
  const error = categoriesQuery.error ?? productsQuery.error;

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display text-xl">{profile.name}</h1>
            <p className="text-xs text-muted-foreground">
              {session?.table?.name ?? 'Mesa no determinada'}
            </p>
          </div>
          <button
            onClick={() => navigate('/cliente/carrito')}
            className="relative w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar en el menu..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border-0 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1 -mx-1 px-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setActiveCategory(category.id);
                setSearch('');
              }}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-[0.96] ${
                activeCategory === category.id && !search
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <span>{category.emoji}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="px-4 pt-4">
          <Alert className="border-destructive/30 bg-destructive/5">
            <AlertTitle>No se pudo cargar el menú</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Error inesperado al consultar backend.'}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {loading ? (
        <div className="px-4 py-16 text-center text-muted-foreground">Cargando menú...</div>
      ) : (
        <div className="px-4 mt-4 grid grid-cols-2 gap-3">
          {filtered.map((product, index) => (
            <button
              key={product.id}
              onClick={() => navigate(`/cliente/producto/${product.id}`)}
              className={`text-left rounded-2xl bg-card border overflow-hidden transition-all hover:shadow-md active:scale-[0.97] animate-slide-up ${
                !product.available ? 'opacity-50 grayscale' : ''
              }`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div
                className={`h-28 bg-gradient-to-br ${product.gradient || fallbackGradient} flex items-center justify-center text-4xl relative`}
              >
                {product.popular && (
                  <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5" />
                    Popular
                  </span>
                )}
                {product.promo && (
                  <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-[9px] font-bold px-2 py-0.5 rounded-full">
                    Promo
                  </span>
                )}
                {!product.available && (
                  <span className="absolute inset-0 flex items-center justify-center bg-foreground/40 text-card text-xs font-bold rounded-none">
                    No disponible
                  </span>
                )}
                <span className="text-5xl">
                  {product.image || product.name.slice(0, 1).toUpperCase()}
                </span>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">
                  {product.name}
                </h3>
                <p className="font-display text-primary text-base">
                  {formatCurrency(Number(product.price))}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-1">Sin resultados</p>
          <p className="text-sm">Prueba con otro término de búsqueda</p>
        </div>
      )}
    </div>
  );
}
