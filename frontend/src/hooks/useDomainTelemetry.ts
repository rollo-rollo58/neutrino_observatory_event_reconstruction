'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { openObservatoryStream } from '@/lib/websocket-stream';
import type {
  ArrayOverview,
  Detector,
  EventRecord,
  SimulationParams,
} from '@/types/domain';

export function useDomainTelemetry() {
  const [overview, setOverview] = useState<ArrayOverview | null>(null);
  const [detectors, setDetectors] = useState<Detector[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [summary, stations, history] = await Promise.all([
        api.overview(), api.detectors(), api.events(),
      ]);
      setOverview(summary);
      setDetectors(stations);
      setEvents(history);
      setSelectedId((current) => current || history[0]?.id || null);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Telemetry is unavailable');
    }
  }, []);

  useEffect(() => {
    void refresh();
    const connection = openObservatoryStream(() => {
      void refresh();
    }, setConnected);
    return () => connection.close();
  }, [refresh]);

  const simulate = useCallback(async (params: SimulationParams) => {
    setBusy(true);
    try {
      const event = await api.simulate(params);
      setSelectedId(event.id);
      await refresh();
      return event;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Simulation failed');
      return null;
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  return {
    overview,
    detectors,
    events,
    selectedId,
    setSelectedId,
    connected,
    busy,
    error,
    refresh,
    simulate,
    selected: events.find((event) => event.id === selectedId) || null,
  };
}
