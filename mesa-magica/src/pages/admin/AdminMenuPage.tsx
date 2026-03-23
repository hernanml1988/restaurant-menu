import { useState } from 'react';
import { Plus, Search, Edit, Eye, EyeOff, Tag } from 'lucide-react';
import { products, categories } from '@/data/mockData';

export default function AdminMenuPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'all' || p.categoryId === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl mb-1">Menú</h1>
          <p className="text-muted-foreground">{products.length} productos · {categories.length} categorías</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.97]">
          <Plus className="w-4 h-4" /> Nuevo producto
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveCategory('all')} className={`px-3 py-2 rounded-lg text-xs font-medium ${activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            Todos
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`px-3 py-2 rounded-lg text-xs font-medium ${activeCategory === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Producto</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Categoría</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Precio</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Extras</th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">Estado</th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const cat = categories.find(c => c.id === p.categoryId);
              return (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${p.gradient} flex items-center justify-center text-lg`}>{p.image}</div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        {p.popular && <span className="text-[10px] text-primary font-medium">⭐ Popular</span>}
                        {p.promo && <span className="text-[10px] text-accent font-medium ml-1">🔥 Promo</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{cat?.emoji} {cat?.name}</td>
                  <td className="py-3 px-4 text-right font-display tabular-nums">S/ {p.price}</td>
                  <td className="py-3 px-4 text-center">
                    {p.extras.length > 0 && (
                      <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-xs">
                        <Tag className="w-3 h-3" /> {p.extras.length}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.available ? (
                      <span className="inline-flex items-center gap-1 text-accent text-xs font-medium"><Eye className="w-3 h-3" /> Disponible</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-destructive text-xs font-medium"><EyeOff className="w-3 h-3" /> No disponible</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="p-2 rounded-lg hover:bg-muted active:scale-[0.95]">
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
