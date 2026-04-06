import { useEffect, useRef } from 'react';
import type { RealtimeEventPayload } from '@/services/realtimeService';

type RealtimeFactory = () => EventSource;

export function useRealtimeSubscription(
  createSource: RealtimeFactory | null,
  onMessage: (payload: RealtimeEventPayload) => void,
) {
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!createSource) {
      return;
    }

    const source = createSource();

    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as RealtimeEventPayload;
        onMessageRef.current(payload);
      } catch {
        return;
      }
    };

    return () => {
      source.close();
    };
  }, [createSource]);
}
