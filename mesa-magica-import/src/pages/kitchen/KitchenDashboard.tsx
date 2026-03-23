import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, AlertTriangle, ChefHat, Eye, Filter, LogOut, ShieldCheck } from 'lucide-react';
import { orders, type Order } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';

const columns = [
  { id: 'received' as const, label: 'Pendiente', color: 'bg-status-pending', dotColor: 'bg-status-pending' },
  { id: 'preparing' as const, label: 'Preparando', color: 'bg-status-preparing', dotColor: 'bg-status-preparing' },
  { id: 'ready' as const, label: 'Listo', color: 'bg-status-ready', dotColor: 'bg-status-ready' },
];

const stations = ['Todas', 'Cocina', 'Bar', 'Postres'];

export default function KitchenDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [ordersList, setOrdersList] = useState<Order[]>(orders);
  const [activeStation, setActiveStation] = useState('Todas');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    if (activeStation === 'Todas') return ordersList;
    return ordersList.filter(o => o.station.toLowerCase() === activeStation.toLowerCase());
  }, [ordersList, activeStation]);

  const moveOrder = (orderId: string, newStatus: Order['status']) => {
    setOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    setSelectedOrder(null);
  };

  const nextStatus: Record<string, Order['status'] | null> = {
    received: 'preparing',
    preparing: 'ready',
    ready: 'delivered',
    delivered: null,
  };

  const statusLabel: Record<string, string> = {
    received: 'Comenzar',
    preparing: 'Marcar listo',
    ready: 'Entregar',
  };

  return (
    <div className="kitchen-theme min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted active:scale-[0.95]">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display text-xl flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-status-pending" />
              Panel de Cocina
            </h1>
            <p className="text-xs text-muted-foreground">{filtered.filter(o => o.status !== 'delivered').length} pedidos activos</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          {user ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card/60 px-4 py-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-pending/15 text-status-pending">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{user.fullName}</p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Cocina
                </p>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login', { replace: true });
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Cerrar sesion"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {stations.map(s => (
              <button
                key={s}
                onClick={() => setActiveStation(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeStation === s
                    ? 'bg-status-pending/20 text-status-pending'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Kanban */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-80px)] overflow-hidden">
        {columns.map(col => {
          const colOrders = filtered.filter(o => o.status === col.id);
          return (
            <div key={col.id} className="flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-3 h-3 rounded-full ${col.dotColor}`} />
                <h2 className="font-semibold text-sm">{col.label}</h2>
                <span className="ml-auto bg-muted text-muted-foreground text-xs font-bold px-2 py-0.5 rounded-full">{colOrders.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin pr-1">
                {colOrders.map((order, i) => (
                  <div
                    key={order.id}
                    className={`bg-card border rounded-xl p-4 transition-all hover:shadow-lg animate-slide-up ${
                      order.priority === 'high' ? 'border-status-pending/40' : ''
                    }`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">#{order.number}</span>
                          {order.priority === 'high' && (
                            <span className="flex items-center gap-0.5 bg-status-pending/15 text-status-pending text-[10px] font-bold px-1.5 py-0.5 rounded">
                              <AlertTriangle className="w-2.5 h-2.5" /> Prioridad
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{order.tableName}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {order.timestamp}
                        </div>
                        <span className="text-[10px] text-muted-foreground capitalize">{order.station}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      {order.items.map((item, j) => (
                        <div key={j} className="flex items-start gap-2 text-sm">
                          <span className="bg-muted text-muted-foreground text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5">{item.quantity}x</span>
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.extras.length > 0 && (
                              <p className="text-xs text-muted-foreground">{item.extras.join(', ')}</p>
                            )}
                            {item.notes && <p className="text-xs text-status-pending italic">{item.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.observations && (
                      <p className="text-xs text-status-pending bg-status-pending/10 rounded-lg px-3 py-2 mb-3">
                        📝 {order.observations}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex-1 py-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1 hover:bg-muted active:scale-[0.97]"
                      >
                        <Eye className="w-3 h-3" /> Detalle
                      </button>
                      {nextStatus[order.status] && (
                        <button
                          onClick={() => moveOrder(order.id, nextStatus[order.status]!)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium active:scale-[0.97] ${
                            order.status === 'received'
                              ? 'bg-status-preparing text-white'
                              : order.status === 'preparing'
                              ? 'bg-status-ready text-white'
                              : 'bg-muted'
                          }`}
                        >
                          {statusLabel[order.status]}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {colOrders.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    Sin pedidos
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6" onClick={() => setSelectedOrder(null)}>
          <div className="bg-card rounded-2xl p-6 max-w-md w-full animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl">Pedido #{selectedOrder.number}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="text-muted-foreground">Mesa:</span> {selectedOrder.tableName}</p>
              <p><span className="text-muted-foreground">Hora:</span> {selectedOrder.timestamp}</p>
              <p><span className="text-muted-foreground">Estación:</span> <span className="capitalize">{selectedOrder.station}</span></p>
              <p><span className="text-muted-foreground">Total:</span> S/ {selectedOrder.total}</p>
            </div>
            <h3 className="font-semibold text-sm mb-2">Productos</h3>
            <div className="space-y-2 mb-4">
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="bg-muted rounded-lg p-3">
                  <p className="font-medium">{item.quantity}x {item.name}</p>
                  {item.extras.length > 0 && <p className="text-xs text-muted-foreground">{item.extras.join(', ')}</p>}
                  {item.notes && <p className="text-xs text-status-pending">Nota: {item.notes}</p>}
                </div>
              ))}
            </div>
            {selectedOrder.observations && (
              <p className="text-sm text-status-pending bg-status-pending/10 rounded-lg px-3 py-2 mb-4">📝 {selectedOrder.observations}</p>
            )}
            {nextStatus[selectedOrder.status] && (
              <button
                onClick={() => moveOrder(selectedOrder.id, nextStatus[selectedOrder.status]!)}
                className="w-full py-3 rounded-xl bg-status-preparing text-white font-medium active:scale-[0.97]"
              >
                {statusLabel[selectedOrder.status]}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
