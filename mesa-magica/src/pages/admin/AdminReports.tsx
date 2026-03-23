import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { salesByDay, topProducts, prepTimes } from '@/data/mockData';

const pieData = topProducts.slice(0, 5).map(p => ({ name: p.name, value: p.orders }));
const COLORS = ['hsl(18, 76%, 48%)', 'hsl(152, 32%, 38%)', 'hsl(38, 92%, 50%)', 'hsl(210, 70%, 50%)', 'hsl(20, 10%, 60%)'];

export default function AdminReports() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl mb-1">Reportes</h1>
        <p className="text-muted-foreground">Métricas y análisis de la semana</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by day */}
        <div className="bg-card border rounded-2xl p-6 animate-slide-up">
          <h2 className="font-semibold mb-4">Ventas por día (S/)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(32, 18%, 88%)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`S/ ${v.toLocaleString()}`, 'Ventas']} />
              <Bar dataKey="sales" fill="hsl(18, 76%, 48%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Prep times */}
        <div className="bg-card border rounded-2xl p-6 animate-slide-up delay-100">
          <h2 className="font-semibold mb-4">Tiempo de preparación promedio (min)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={prepTimes}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(32, 18%, 88%)" />
              <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`${v} min`, 'Promedio']} />
              <Line type="monotone" dataKey="avg" stroke="hsl(152, 32%, 38%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Popular products pie */}
        <div className="bg-card border rounded-2xl p-6 animate-slide-up delay-200">
          <h2 className="font-semibold mb-4">Productos más pedidos</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" stroke="none">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {pieData.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-muted-foreground">{p.name}</span>
                  <span className="font-medium ml-auto tabular-nums">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="bg-card border rounded-2xl p-6 animate-slide-up delay-300">
          <h2 className="font-semibold mb-4">Resumen semanal</h2>
          <div className="space-y-4">
            {[
              { label: 'Pedidos totales', value: '238', change: '+14%' },
              { label: 'Ticket promedio', value: 'S/ 67.40', change: '+8%' },
              { label: 'Clientes atendidos', value: '412', change: '+22%' },
              { label: 'Producto estrella', value: 'Lomo Saltado', change: '47 pedidos' },
              { label: 'Hora pico', value: '13:00 - 14:00', change: '32% de pedidos' },
            ].map(stat => (
              <div key={stat.label} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="text-muted-foreground text-sm">{stat.label}</span>
                <div className="text-right">
                  <span className="font-medium text-sm">{stat.value}</span>
                  <span className="text-xs text-accent ml-2">{stat.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
