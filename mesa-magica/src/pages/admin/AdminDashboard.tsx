import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getDashboardSummaryRequest } from '@/services/dashboardService';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminDashboard() {
  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard', 'summary'],
    queryFn: getDashboardSummaryRequest,
  });

  const dashboard = dashboardQuery.data;
  const topProducts = dashboard?.topProducts ?? [];
  const topReference = topProducts[0]?.orders ?? 1;

  const kpis = [
    {
      label: 'Mesas ocupadas',
      value: `${dashboard?.occupiedTables ?? 0}/${dashboard?.totalTables ?? 0}`,
      icon: Users,
      change: `${dashboard?.totalTables ?? 0} mesas configuradas`,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Pedidos activos',
      value: String(dashboard?.activeOrders ?? 0),
      icon: TrendingUp,
      change: `${dashboard?.completedOrders ?? 0} completados hoy`,
      color: 'bg-accent/10 text-accent',
    },
    {
      label: 'Ventas del dia',
      value: formatCurrency(dashboard?.totalSalesToday ?? 0),
      icon: DollarSign,
      change: `${topProducts.length} productos destacados`,
      color: 'bg-status-pending/10 text-status-pending',
    },
    {
      label: 'Tiempo promedio',
      value: `${dashboard?.avgPrepTime ?? 0} min`,
      icon: Clock,
      change: 'Promedio del rango actual',
      color: 'bg-status-preparing/10 text-status-preparing',
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="mb-1 font-display text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen general del dia
          {dashboard?.dateLabel ? ` - ${dashboard.dateLabel}` : ''}
        </p>
      </div>

      {dashboardQuery.error && (
        <Alert className="mb-6 border-destructive/30 bg-destructive/5">
          <AlertTitle>No se pudo cargar el dashboard</AlertTitle>
          <AlertDescription>
            {dashboardQuery.error instanceof Error
              ? dashboardQuery.error.message
              : 'Verifica la sesion activa y la conexion con el backend.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <div
            key={kpi.label}
            className="animate-slide-up rounded-2xl border bg-card p-5"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.color}`}
              >
                <kpi.icon className="h-5 w-5" />
              </div>
              <span className="flex items-center gap-0.5 text-xs text-accent">
                <ArrowUpRight className="h-3 w-3" />
                {kpi.change}
              </span>
            </div>
            <p className="mb-0.5 font-display text-2xl">{kpi.value}</p>
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="animate-slide-up rounded-2xl border bg-card p-6 delay-300">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Productos mas pedidos hoy</h2>
            <p className="text-sm text-muted-foreground">
              Ranking operativo del dashboard administrativo.
            </p>
          </div>
          {dashboardQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          )}
        </div>

        <div className="space-y-3">
          {topProducts.map((product) => (
            <div key={product.productId} className="flex items-center gap-4">
              <span className="w-6 text-sm font-medium tabular-nums text-muted-foreground">
                {product.rank}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.orders} pedidos
                </p>
              </div>
              <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.max(
                      8,
                      (product.orders / Math.max(topReference, 1)) * 100,
                    )}%`,
                  }}
                />
              </div>
              <span className="w-24 text-right font-display text-sm tabular-nums text-primary">
                {formatCurrency(product.revenue)}
              </span>
            </div>
          ))}

          {!dashboardQuery.isLoading && !topProducts.length && (
            <p className="text-sm text-muted-foreground">
              No hay productos pedidos en el rango actual.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
