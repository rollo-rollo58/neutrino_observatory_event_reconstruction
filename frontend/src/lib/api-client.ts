import type {
  ArrayOverview,
  Detector,
  EventRecord,
  SimulationParams,
  TriggerState,
  PhotonHit,
} from '@/types/domain';

const ROOT = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function readJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${ROOT}${path}`, {
    cache: 'no-store',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const detail = await response.json();
      message = String(detail.detail || message);
    } catch {
      // The HTTP status remains available if the body is not JSON.
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export const api = {
  overview: () => readJson<ArrayOverview>('/api/v1/overview'),
  detectors: () => readJson<Detector[]>('/api/v1/detectors'),
  events: () => readJson<EventRecord[]>('/api/v1/events?limit=50'),
  simulate: (params: SimulationParams) => readJson<EventRecord>('/api/v1/simulate', {
    method: 'POST',
    body: JSON.stringify(params),
  }),
  trigger: (hits: PhotonHit[], window: number, multiplicity: number) =>
    readJson<TriggerState>('/api/v1/trigger', {
      method: 'POST',
      body: JSON.stringify({
        hits,
        window_ns: window,
        minimum_channels: multiplicity,
      }),
    }),
};

export const apiStreamUrl = `${ROOT}/api/v1/stream`;
