const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3015';

export interface RealtimeEventPayload {
  event: string;
  sessionToken: string | null;
  payload: Record<string, unknown>;
}

export function createInternalRealtimeSource() {
  return new EventSource(`${API_BASE_URL}/realtime/internal`, {
    withCredentials: true,
  });
}

export function createSessionRealtimeSource(sessionToken: string) {
  return new EventSource(`${API_BASE_URL}/realtime/public/session/${sessionToken}`);
}
