import { useState } from 'react';
import { QrCode, Plus, Settings, Wifi, WifiOff } from 'lucide-react';
import { tables, type Table } from '@/data/mockData';

const statusConfig: Record<Table['status'], { label: string; color: string; bg: string }> = {
  free: { label: 'Libre', color: 'text-accent', bg: 'bg-accent/10' },
  occupied: { label: 'Ocupada', color: 'text-status-pending', bg: 'bg-status-pending/10' },
  'with-order': { label: 'Con pedido', color: 'text-status-preparing', bg: 'bg-status-preparing/10' },
  'pending-payment': { label: 'Por cobrar', color: 'text-destructive', bg: 'bg-destructive/10' },
};

const zones = ['Todas', 'Interior', 'Terraza', 'Barra'];

export default function AdminTables() {
  const [activeZone, setActiveZone] = useState('Todas');
  const [showQR, setShowQR] = useState<string | null>(null);

  const filtered = activeZone === 'Todas' ? tables : tables.filter(t => t.zone === activeZone);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl mb-1">Mesas</h1>
          <p className="text-muted-foreground">Gestión y estado de mesas del restaurante</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.97]">
          <Plus className="w-4 h-4" /> Nueva mesa
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {zones.map(z => (
          <button
            key={z}
            onClick={() => setActiveZone(z)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeZone === z ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {z}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((table, i) => {
          const status = statusConfig[table.status];
          return (
            <div key={table.id} className="bg-card border rounded-2xl p-5 animate-slide-up hover:shadow-md transition-all" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{table.name}</h3>
                  <p className="text-xs text-muted-foreground">{table.zone} · {table.capacity} personas</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>

              {table.activeOrders > 0 && (
                <p className="text-xs text-muted-foreground mb-3">
                  {table.activeOrders} pedido{table.activeOrders > 1 ? 's' : ''} activo{table.activeOrders > 1 ? 's' : ''}
                </p>
              )}

              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => setShowQR(showQR === table.id ? null : table.id)}
                  className="flex-1 py-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1 hover:bg-muted active:scale-[0.97]"
                >
                  <QrCode className="w-3 h-3" /> QR
                </button>
                <button className="flex-1 py-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1 hover:bg-muted active:scale-[0.97]">
                  <Settings className="w-3 h-3" /> Editar
                </button>
                <button className="py-2 px-3 rounded-lg border text-xs hover:bg-muted active:scale-[0.97]">
                  {table.status === 'free' ? <WifiOff className="w-3 h-3 text-muted-foreground" /> : <Wifi className="w-3 h-3 text-accent" />}
                </button>
              </div>

              {showQR === table.id && (
                <div className="mt-3 p-4 bg-muted rounded-xl text-center animate-scale-in">
                  <div className="w-32 h-32 mx-auto bg-card rounded-xl border-2 border-dashed border-border flex items-center justify-center mb-2">
                    <QrCode className="w-16 h-16 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">{table.qrCode}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Escanear para acceder al menú</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
