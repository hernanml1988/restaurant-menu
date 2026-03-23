import { useState } from 'react';
import { Search, Eye, XCircle, RotateCcw } from 'lucide-react';
import { orders, type Order } from '@/data/mockData';

const statusConfig: Record<Order['status'], { label: string; color: string; bg: string }> = {
  received: { label: 'Recibido', color: 'text-status-pending', bg: 'bg-status-pending/10' },
  preparing: { label: 'Preparando', color: 'text-status-preparing', bg: 'bg-status-preparing/10' },
  ready: { label: 'Listo', color: 'text-status-ready', bg: 'bg-status-ready/10' },
  delivered: { label: 'Entregado', color: 'text-status-delivered', bg: 'bg-status-delivered/10' },
};

const filters = ['Todos', 'Recibido', 'Preparando', 'Listo', 'Entregado'];
const filterMap: Record<string, string> = { Todos: '', Recibido: 'received', Preparando: 'preparing', Listo: 'ready', Entregado: 'delivered' };

export default function AdminOrders() {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = orders.filter(o => {
    const matchStatus = !filterMap[activeFilter] || o.status === filterMap[activeFilter];
    const matchSearch = !search || o.tableName.toLowerCase().includes(search.toLowerCase()) || o.number.toString().includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-3xl mb-1">Pedidos</h1>
        <p className="text-muted-foreground">{orders.length} pedidos hoy</p>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar por mesa o número..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)} className={`px-3 py-2 rounded-lg text-xs font-medium ${activeFilter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((order, i) => {
          const status = statusConfig[order.status];
          return (
            <div key={order.id} className="bg-card border rounded-2xl p-5 flex items-center gap-4 animate-slide-up hover:shadow-md transition-all" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center font-bold text-sm">
                #{order.number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold">{order.tableName}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${status.bg} ${status.color}`}>{status.label}</span>
                  {order.priority === 'high' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-status-pending/10 text-status-pending">Prioridad</span>}
                </div>
                <p className="text-xs text-muted-foreground">{order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{order.timestamp} · {order.station} · S/ {order.total}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setSelectedOrder(order)} className="p-2 rounded-lg border hover:bg-muted active:scale-[0.95]">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg border hover:bg-muted active:scale-[0.95]">
                  <RotateCcw className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="p-2 rounded-lg border hover:bg-muted active:scale-[0.95]">
                  <XCircle className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6" onClick={() => setSelectedOrder(null)}>
          <div className="bg-card rounded-2xl p-6 max-w-md w-full animate-scale-in border" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h2 className="font-display text-xl">Pedido #{selectedOrder.number}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-muted-foreground">✕</button>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="text-muted-foreground">Mesa:</span> {selectedOrder.tableName}</p>
              <p><span className="text-muted-foreground">Hora:</span> {selectedOrder.timestamp}</p>
              <p><span className="text-muted-foreground">Estado:</span> {statusConfig[selectedOrder.status].label}</p>
              <p><span className="text-muted-foreground">Total:</span> S/ {selectedOrder.total}</p>
            </div>
            <div className="space-y-2">
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="bg-muted rounded-lg p-3 text-sm">
                  <p className="font-medium">{item.quantity}x {item.name}</p>
                  {item.extras.length > 0 && <p className="text-xs text-muted-foreground">{item.extras.join(', ')}</p>}
                  {item.notes && <p className="text-xs text-status-pending">Nota: {item.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
