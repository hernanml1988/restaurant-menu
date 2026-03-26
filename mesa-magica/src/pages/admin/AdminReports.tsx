import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  getPrepTimesReportRequest,
  getSalesByDayReportRequest,
  getTopProductsReportRequest,
  getWeeklySummaryReportRequest,
} from '@/services/reportService';

const COLORS = [
  'hsl(18, 76%, 48%)',
  'hsl(152, 32%, 38%)',
  'hsl(38, 92%, 50%)',
  'hsl(210, 70%, 50%)',
  'hsl(20, 10%, 60%)',
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminReports() {
  const salesQuery = useQuery({
    queryKey: ['admin', 'reports', 'sales-by-day'],
    queryFn: getSalesByDayReportRequest,
  });

  const prepTimesQuery = useQuery({
    queryKey: ['admin', 'reports', 'prep-times'],
    queryFn: getPrepTimesReportRequest,
  });

  const topProductsQuery = useQuery({
    queryKey: ['admin', 'reports', 'top-products'],
    queryFn: getTopProductsReportRequest,
  });

  const weeklySummaryQuery = useQuery({
    queryKey: ['admin', 'reports', 'weekly-summary'],
    queryFn: getWeeklySummaryReportRequest,
  });

  const isLoading =
    salesQuery.isLoading ||
    prepTimesQuery.isLoading ||
    topProductsQuery.isLoading ||
    weeklySummaryQuery.isLoading;

  const hasError =
    salesQuery.isError ||
    prepTimesQuery.isError ||
    topProductsQuery.isError ||
    weeklySummaryQuery.isError;

  const errorMessage =
    (salesQuery.error instanceof Error && salesQuery.error.message) ||
    (prepTimesQuery.error instanceof Error && prepTimesQuery.error.message) ||
    (topProductsQuery.error instanceof Error && topProductsQuery.error.message) ||
    (weeklySummaryQuery.error instanceof Error &&
      weeklySummaryQuery.error.message) ||
    'Verifica la sesion activa y la conexion con el backend.';

  const pieData = useMemo(
    () =>
      (topProductsQuery.data ?? []).map((product) => ({
        name: product.name,
        value: product.orders,
      })),
    [topProductsQuery.data],
  );

  const summaryStats = useMemo(() => {
    const summary = weeklySummaryQuery.data;

    return [
      {
        label: 'Pedidos totales',
        value: String(summary?.totalOrders ?? 0),
        change: summary ? formatCurrency(summary.totalSales) : formatCurrency(0),
      },
      {
        label: 'Ticket promedio',
        value: formatCurrency(summary?.averageTicket ?? 0),
        change: 'Promedio por pedido',
      },
      {
        label: 'Clientes atendidos',
        value: String(summary?.customersServed ?? 0),
        change: 'Sesiones creadas',
      },
      {
        label: 'Producto estrella',
        value: summary?.starProduct?.name ?? 'Sin datos',
        change: summary?.starProduct
          ? `${summary.starProduct.orders} pedidos`
          : 'Sin pedidos',
      },
      {
        label: 'Hora pico',
        value: summary?.peakHour?.label ?? 'Sin datos',
        change: summary?.peakHour
          ? `${summary.peakHour.share}% de pedidos`
          : 'Sin pedidos',
      },
    ];
  }, [weeklySummaryQuery.data]);

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="mb-1 font-display text-3xl">Reportes</h1>
        <p className="text-muted-foreground">Metricas y analisis de la semana</p>
      </div>

      {hasError && (
        <Alert className="mb-6 border-destructive/30 bg-destructive/5">
          <AlertTitle>No se pudieron cargar los reportes</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="animate-slide-up rounded-2xl border bg-card p-6">
          <h2 className="mb-4 font-semibold">Ventas por dia</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesQuery.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(32, 18%, 88%)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Ventas']}
              />
              <Bar
                dataKey="sales"
                fill="hsl(18, 76%, 48%)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          {isLoading && (
            <p className="mt-3 text-sm text-muted-foreground">
              Cargando ventas...
            </p>
          )}
        </div>

        <div className="animate-slide-up rounded-2xl border bg-card p-6 delay-100">
          <h2 className="mb-4 font-semibold">
            Tiempo de preparacion promedio (min)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={prepTimesQuery.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(32, 18%, 88%)" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [`${value} min`, 'Promedio']}
              />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="hsl(152, 32%, 38%)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
          {isLoading && (
            <p className="mt-3 text-sm text-muted-foreground">
              Cargando tiempos de preparacion...
            </p>
          )}
        </div>

        <div className="animate-slide-up rounded-2xl border bg-card p-6 delay-200">
          <h2 className="mb-4 font-semibold">Productos mas pedidos</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {pieData.map((product, index) => (
                <div key={product.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-muted-foreground">{product.name}</span>
                  <span className="ml-auto font-medium tabular-nums">
                    {product.value}
                  </span>
                </div>
              ))}
              {!pieData.length && !isLoading && (
                <p className="text-sm text-muted-foreground">
                  Sin pedidos en el rango.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="animate-slide-up rounded-2xl border bg-card p-6 delay-300">
          <h2 className="mb-4 font-semibold">Resumen semanal</h2>
          <div className="space-y-4">
            {summaryStats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between border-b py-2 last:border-0"
              >
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className="text-right">
                  <span className="text-sm font-medium">{stat.value}</span>
                  <span className="ml-2 text-xs text-accent">{stat.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
