import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Eye, EyeOff, Plus, Search, Tag, Trash2 } from 'lucide-react';
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
import { formatCurrency } from '@/lib/currency';
import {
  createCategoryRequest,
  deactivateCategoryRequest,
  getCategoriesRequest,
  type CategoryRecord,
  updateCategoryRequest,
} from '@/services/categoryService';
import {
  createProductRequest,
  deactivateProductRequest,
  getProductsRequest,
  type ProductRecord,
  updateProductRequest,
} from '@/services/productService';
import { getCurrentRestaurantRequest } from '@/services/restaurantService';

type CategoryForm = { name: string; emoji: string };
type ProductForm = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  image: string;
  gradient: string;
  allergens: string;
  available: boolean;
  popular: boolean;
  promo: boolean;
  trackStock: boolean;
  stockQuantity: string;
  stockAlertThreshold: string;
};

const emptyCategoryForm: CategoryForm = { name: '', emoji: '' };
const emptyProductForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  image: '',
  gradient: '',
  allergens: '',
  available: true,
  popular: false,
  promo: false,
  trackStock: false,
  stockQuantity: '0',
  stockAlertThreshold: '0',
};
const fallbackGradient = 'from-amber-100 to-orange-100';

export default function AdminMenuPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryRecord | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductRecord | null>(null);
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: getCategoriesRequest,
  });
  const productsQuery = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: getProductsRequest,
  });
  const restaurantQuery = useQuery({
    queryKey: ['restaurant', 'current'],
    queryFn: getCurrentRestaurantRequest,
  });

  const categories = useMemo(
    () => (categoriesQuery.data ?? []).filter((item) => item.state),
    [categoriesQuery.data],
  );
  const products = useMemo(
    () => (productsQuery.data ?? []).filter((item) => item.state),
    [productsQuery.data],
  );
  const restaurantId =
    restaurantQuery.data?.id ??
    categories[0]?.restaurant?.id ??
    products[0]?.restaurant?.id ??
    '';
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const categoryMatch =
        activeCategory === 'all' || product.category?.id === activeCategory;
      const searchMatch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term);
      return categoryMatch && searchMatch;
    });
  }, [activeCategory, products, search]);

  const refreshMenu = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
  };

  const createCategory = useMutation({
    mutationFn: createCategoryRequest,
    onSuccess: () => {
      refreshMenu();
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryForm(emptyCategoryForm);
      toast({ title: 'Categoria creada' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo crear la categoria',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });
  const updateCategory = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateCategoryRequest>[1] }) =>
      updateCategoryRequest(id, payload),
    onSuccess: () => {
      refreshMenu();
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      setCategoryForm(emptyCategoryForm);
      toast({ title: 'Categoria actualizada' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo actualizar la categoria',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });
  const deleteCategory = useMutation({
    mutationFn: deactivateCategoryRequest,
    onSuccess: (_, deletedId) => {
      refreshMenu();
      setCategoryToDelete(null);
      if (activeCategory === deletedId) setActiveCategory('all');
      toast({ title: 'Categoria eliminada' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo eliminar la categoria',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });
  const createProduct = useMutation({
    mutationFn: createProductRequest,
    onSuccess: () => {
      refreshMenu();
      setProductDialogOpen(false);
      setEditingProduct(null);
      setProductForm(emptyProductForm);
      toast({ title: 'Producto creado' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo crear el producto',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });
  const updateProduct = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateProductRequest>[1] }) =>
      updateProductRequest(id, payload),
    onSuccess: () => {
      refreshMenu();
      setProductDialogOpen(false);
      setEditingProduct(null);
      setProductForm(emptyProductForm);
      toast({ title: 'Producto actualizado' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo actualizar el producto',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });
  const deleteProduct = useMutation({
    mutationFn: deactivateProductRequest,
    onSuccess: () => {
      refreshMenu();
      setProductToDelete(null);
      toast({ title: 'Producto eliminado' });
    },
    onError: (error) =>
      toast({
        title: 'No se pudo eliminar el producto',
        description: error instanceof Error ? error.message : 'Error inesperado.',
        variant: 'destructive',
      }),
  });

  const openCategoryCreate = () => {
    setEditingCategory(null);
    setCategoryForm(emptyCategoryForm);
    setCategoryDialogOpen(true);
  };
  const openCategoryEdit = (category: CategoryRecord) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, emoji: category.emoji });
    setCategoryDialogOpen(true);
  };
  const openProductCreate = () => {
    setEditingProduct(null);
    setProductForm({
      ...emptyProductForm,
      categoryId: activeCategory !== 'all' ? activeCategory : '',
    });
    setProductDialogOpen(true);
  };
  const openProductEdit = (product: ProductRecord) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      categoryId: product.category?.id ?? '',
      image: product.image ?? '',
      gradient: product.gradient ?? '',
      allergens: product.allergens.join(', '),
      available: product.available,
      popular: product.popular,
      promo: product.promo,
      trackStock: product.trackStock,
      stockQuantity: String(product.stockQuantity),
      stockAlertThreshold: String(product.stockAlertThreshold),
    });
    setProductDialogOpen(true);
  };

  const submitCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!restaurantId || !categoryForm.name.trim() || !categoryForm.emoji.trim()) {
      toast({
        title: 'Faltan datos',
        description: 'Necesitas restaurante, nombre y emoji para la categoria.',
        variant: 'destructive',
      });
      return;
    }
    const payload = {
      restaurantId,
      name: categoryForm.name.trim(),
      emoji: categoryForm.emoji.trim(),
    };
    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, payload });
      return;
    }
    createCategory.mutate(payload);
  };

  const submitProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const price = Math.round(Number(productForm.price));
    if (
      !restaurantId ||
      !productForm.name.trim() ||
      !productForm.description.trim() ||
      !productForm.categoryId ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      toast({
        title: 'Datos invalidos',
        description: 'Completa nombre, descripcion, categoria y un precio valido.',
        variant: 'destructive',
      });
      return;
    }
    const payload = {
      restaurantId,
      categoryId: productForm.categoryId,
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price,
      available: productForm.available,
      popular: productForm.popular,
      promo: productForm.promo,
      trackStock: productForm.trackStock,
      stockQuantity: Number(productForm.stockQuantity || 0),
      stockAlertThreshold: Number(productForm.stockAlertThreshold || 0),
      allergens: productForm.allergens
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      ...(productForm.image.trim() ? { image: productForm.image.trim() } : {}),
      ...(productForm.gradient.trim()
        ? { gradient: productForm.gradient.trim() }
        : {}),
    };
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, payload });
      return;
    }
    createProduct.mutate(payload);
  };

  const loading = categoriesQuery.isLoading || productsQuery.isLoading;
  const loadingError = categoriesQuery.error ?? productsQuery.error;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="mb-1 font-display text-3xl">Menu</h1>
          <p className="text-muted-foreground">
            {products.length} productos · {categories.length} categorias
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openCategoryCreate}>
            <Plus className="mr-2 h-4 w-4" /> Categoria
          </Button>
          <Button onClick={openProductCreate}>
            <Plus className="mr-2 h-4 w-4" /> Producto
          </Button>
        </div>
      </div>

      {!restaurantId && (
        <Alert className="border-status-pending/30 bg-status-pending/5">
          <AlertTitle>Configuracion pendiente</AlertTitle>
          <AlertDescription>
            No se pudo resolver el restaurante actual desde backend.
          </AlertDescription>
        </Alert>
      )}

      {loadingError && (
        <Alert className="border-destructive/30 bg-destructive/5">
          <AlertTitle>No se pudo cargar el menu</AlertTitle>
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
            <h2 className="font-display text-2xl">Productos</h2>
            <p className="text-sm text-muted-foreground">CRUD completo del menu.</p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar producto..."
            />
          </div>
        </div>
        <div className="border-b bg-muted/30 px-5 py-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-background'
              }`}
              onClick={() => setActiveCategory('all')}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`rounded-lg px-3 py-2 text-xs font-medium ${
                  activeCategory === category.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background'
                }`}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.emoji} {category.name}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Producto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoria</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Precio</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Stock</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Extras</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Cargando productos...
                  </td>
                </tr>
              )}
              {!loading &&
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${
                            product.gradient || fallbackGradient
                          } text-lg`}
                        >
                          {product.image || product.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {product.description}
                          </p>
                          <div className="mt-1 flex gap-2 text-[10px] font-medium">
                            {product.popular && <span className="text-primary">Popular</span>}
                            {product.promo && <span className="text-accent">Promo</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {product.category
                        ? `${product.category.emoji} ${product.category.name}`
                        : 'Sin categoria'}
                    </td>
                    <td className="px-4 py-3 text-right font-display tabular-nums">
                      {formatCurrency(Number(product.price))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.trackStock ? (
                        <div className="text-xs">
                          <p className="font-medium">{product.stockQuantity}</p>
                          <p className="text-muted-foreground">
                            alerta {product.stockAlertThreshold}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Libre</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.extras.length ? (
                        <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs">
                          <Tag className="h-3 w-3" /> {product.extras.length}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {product.available ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                          <Eye className="h-3 w-3" /> Disponible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                          <EyeOff className="h-3 w-3" /> No disponible
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button type="button" className="rounded-lg p-2 hover:bg-muted" onClick={() => openProductEdit(product)}>
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button type="button" className="rounded-lg p-2 hover:bg-muted" onClick={() => setProductToDelete(product)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && !filteredProducts.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No hay productos para el filtro actual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog
        open={categoryDialogOpen}
        onOpenChange={(open) => {
          setCategoryDialogOpen(open);
          if (!open) {
            setEditingCategory(null);
            setCategoryForm(emptyCategoryForm);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Editar categoria' : 'Nueva categoria'}</DialogTitle>
            <DialogDescription>
              Define el nombre y el emoji que veras en filtros y referencias del menu.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={submitCategory}>
            <div className="space-y-2">
              <Label htmlFor="category-name">Nombre</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                placeholder="Ej: Entradas, Bebidas, Postres"
                onChange={(e) => setCategoryForm((current) => ({ ...current, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-emoji">Emoji</Label>
              <Input
                id="category-emoji"
                value={categoryForm.emoji}
                placeholder="Ej: 🥗, 🍔, 🍰, 🍹"
                onChange={(e) => setCategoryForm((current) => ({ ...current, emoji: e.target.value }))}
              />
              <p className="text-xs font-medium text-accent">
                Para agregar emoji debe presionar " window + . "
              </p>
              <p className="text-xs text-muted-foreground">
                Pega un solo emoji para identificar la categoria visualmente.
                Ejemplos: 🥗 Entradas, 🍔 Fondos, 🍰 Postres, 🍹 Bebidas.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)} disabled={createCategory.isPending || updateCategory.isPending}>Cancelar</Button>
              <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                {createCategory.isPending || updateCategory.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={productDialogOpen}
        onOpenChange={(open) => {
          setProductDialogOpen(open);
          if (!open) {
            setEditingProduct(null);
            setProductForm(emptyProductForm);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
            <DialogDescription>Completa la ficha del producto y su disponibilidad.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={submitProduct}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-name">Nombre</Label>
                <Input id="product-name" value={productForm.name} onChange={(e) => setProductForm((current) => ({ ...current, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-price">Precio</Label>
                <Input id="product-price" type="number" min={0} step="1" value={productForm.price} onChange={(e) => setProductForm((current) => ({ ...current, price: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">Descripcion</Label>
              <Textarea id="product-description" value={productForm.description} onChange={(e) => setProductForm((current) => ({ ...current, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-category">Categoria</Label>
                <select
                  id="product-category"
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm((current) => ({ ...current, categoryId: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecciona una categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.emoji} {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-image">Icono o emoji</Label>
                <Input id="product-image" value={productForm.image} onChange={(e) => setProductForm((current) => ({ ...current, image: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-gradient">Gradiente Tailwind</Label>
                <Input id="product-gradient" value={productForm.gradient} onChange={(e) => setProductForm((current) => ({ ...current, gradient: e.target.value }))} placeholder={fallbackGradient} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-allergens">Alergenos</Label>
                <Input id="product-allergens" value={productForm.allergens} onChange={(e) => setProductForm((current) => ({ ...current, allergens: e.target.value }))} placeholder="Pescado, Mariscos" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                <input type="checkbox" checked={productForm.available} onChange={(e) => setProductForm((current) => ({ ...current, available: e.target.checked }))} />
                Disponible
              </label>
              <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                <input type="checkbox" checked={productForm.popular} onChange={(e) => setProductForm((current) => ({ ...current, popular: e.target.checked }))} />
                Popular
              </label>
              <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                <input type="checkbox" checked={productForm.promo} onChange={(e) => setProductForm((current) => ({ ...current, promo: e.target.checked }))} />
                Promo
              </label>
              <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm">
                <input type="checkbox" checked={productForm.trackStock} onChange={(e) => setProductForm((current) => ({ ...current, trackStock: e.target.checked }))} />
                Controlar stock
              </label>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-stock-quantity">Stock</Label>
                <Input id="product-stock-quantity" type="number" min={0} value={productForm.stockQuantity} onChange={(e) => setProductForm((current) => ({ ...current, stockQuantity: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-stock-alert-threshold">Alerta de stock</Label>
                <Input id="product-stock-alert-threshold" type="number" min={0} value={productForm.stockAlertThreshold} onChange={(e) => setProductForm((current) => ({ ...current, stockAlertThreshold: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)} disabled={createProduct.isPending || updateProduct.isPending}>Cancelar</Button>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                {createProduct.isPending || updateProduct.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar categoria</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete
                ? `Se desactivara ${categoryToDelete.name}.`
                : 'Se desactivara la categoria seleccionada.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCategory.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCategory.isPending || !categoryToDelete}
              onClick={() => categoryToDelete && deleteCategory.mutate(categoryToDelete.id)}
            >
              {deleteCategory.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
            <AlertDialogDescription>
              {productToDelete
                ? `Se desactivara ${productToDelete.name}.`
                : 'Se desactivara el producto seleccionado.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProduct.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProduct.isPending || !productToDelete}
              onClick={() => productToDelete && deleteProduct.mutate(productToDelete.id)}
            >
              {deleteProduct.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
