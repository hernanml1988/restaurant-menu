const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

interface ReportApiResponse<T> {
  message?: string;
  data?: T;
}

export interface SalesByDayRecord {
  date: string;
  day: string;
  sales: number;
  orders: number;
}

export interface PrepTimeRecord {
  hour: string;
  avg: number;
  orders: number;
}

export interface TopProductRecord {
  rank: number;
  productId: string;
  name: string;
  orders: number;
  sales: number;
}

export interface WeeklySummaryRecord {
  totalOrders: number;
  averageTicket: number;
  totalSales: number;
  customersServed: number;
  starProduct: {
    name: string;
    orders: number;
  } | null;
  peakHour: {
    label: string;
    orders: number;
    share: number;
  } | null;
}

async function parseResponseBody<T>(response: Response) {
  try {
    return (await response.json()) as ReportApiResponse<T>;
  } catch {
    return {};
  }
}

async function requestReportApi<T>(path: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const body = await parseResponseBody<T>(response);

  if (!response.ok || body.data === undefined) {
    throw new Error(body.message || 'No se pudieron cargar los reportes.');
  }

  return body.data;
}

export async function getSalesByDayReportRequest() {
  return requestReportApi<SalesByDayRecord[]>('/report/sales-by-day?days=7');
}

export async function getPrepTimesReportRequest() {
  return requestReportApi<PrepTimeRecord[]>('/report/prep-times?days=7');
}

export async function getTopProductsReportRequest() {
  return requestReportApi<TopProductRecord[]>(
    '/report/top-products?days=7&limit=5',
  );
}

export async function getWeeklySummaryReportRequest() {
  return requestReportApi<WeeklySummaryRecord>('/report/weekly-summary?days=7');
}
