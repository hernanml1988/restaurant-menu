const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

interface DashboardApiResponse<T> {
  message?: string;
  data?: T;
}

export interface DashboardTopProductRecord {
  rank: number;
  productId: string;
  name: string;
  orders: number;
  revenue: number;
}

export interface DashboardSummaryRecord {
  dateLabel: string;
  occupiedTables: number;
  totalTables: number;
  activeOrders: number;
  completedOrders: number;
  totalSalesToday: number;
  avgPrepTime: number;
  stockAlerts: number;
  todayReservations: number;
  hasOpenCashSession: boolean;
  discountsToday: number;
  topProducts: DashboardTopProductRecord[];
}

async function parseResponseBody<T>(response: Response) {
  try {
    return (await response.json()) as DashboardApiResponse<T>;
  } catch {
    return {};
  }
}

async function requestDashboardApi<T>(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const body = await parseResponseBody<T>(response);

  if (!response.ok || body.data === undefined) {
    throw new Error(body.message || 'No se pudo cargar el dashboard.');
  }

  return body.data;
}

export async function getDashboardSummaryRequest() {
  return requestDashboardApi<DashboardSummaryRecord>(
    '/report/dashboard-summary?days=1&limit=5',
  );
}
