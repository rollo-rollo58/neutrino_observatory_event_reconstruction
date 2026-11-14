import { apiStreamUrl } from '@/lib/api-client';
import type { StreamActivity } from '@/types/domain';

export interface LiveStreamConnection {
  close(): void;
}

/** EventSource is used instead of WebSockets to simplify read-only telemetry. */
export function openObservatoryStream(
  onActivity: (message: StreamActivity) => void,
  onState: (connected: boolean) => void,
): LiveStreamConnection {
  const stream = new EventSource(apiStreamUrl);
  stream.onopen = () => onState(true);
  stream.onerror = () => onState(false);
  stream.addEventListener('telemetry', (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as StreamActivity;
      if (data.kind === 'observatory_activity') {
        onActivity(data);
      }
    } catch {
      onState(false);
    }
  });
  return {
    close() {
      stream.close();
      onState(false);
    },
  };
}
