import { TrendingUp, Users, Clock, DollarSign, ArrowUpRight } from 'lucide-react';
import { dailyStats, topProducts } from '@/data/mockData';

const kpis = [
  { label: 'Mesas ocupadas', value: `${dailyStats.occupiedTables}/${dailyStats.totalTables}`, icon: Users, change: '+2 vs ayer', color: 'bg-primary/10 text-primary' },
  { label: 'Pedidos activos', value: dailyStats.activeOrders, icon: TrendingUp, change: '34 completados', color: 'bg-accent/10 text-accent' },
  { label: 'Ventas del día', value: `S/ ${dailyStats.totalSalesToday.toLocaleString()}`, icon: DollarSign, change: '+12% vs promedio', color: 'bg-status-pending/10 text-status-pending' },
  { label: 'Tiempo promedio', value: `${dailyStats.avgPrepTime} min`, icon: Clock, change: '-3 min vs ayer', color: 'bg-status-preparing/10 text-status-preparing' },
];

export default function AdminDashboard() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general del día — Domingo, 22 de marzo 2026</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <div key={kpi.label} className="bg-card border rounded-2xl p-5 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-accent flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                {kpi.change}
              </span>
            </div>
            <p className="font-display text-2xl mb-0.5">{kpi.value}</p>
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Top products */}
      <div className="bg-card border rounded-2xl p-6 animate-slide-up delay-300">
        <h2 className="font-semibold text-lg mb-4">Productos más pedidos hoy</h2>
        <div className="space-y-3">
          {topProducts.map((p, i) => (
            <div key={p.name} className="flex items-center gap-4">
              <span className="w-6 text-sm text-muted-foreground font-medium tabular-nums">{i + 1}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.orders} pedidos</p>
              </div>
              <div className="w-32 bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${(p.orders / topProducts[0].orders) * 100}%` }} />
              </div>
              <span className="text-sm font-display text-primary tabular-nums w-20 text-right">S/ {p.revenue.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
