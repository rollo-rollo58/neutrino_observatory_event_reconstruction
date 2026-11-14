'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';
import type { EventRecord, TriggerState } from '@/types/domain';

interface Props { event: EventRecord | null }

export default function TriggerConsole({ event }: Props) {
  const [window, setWindow] = useState(300);
  const [multiplicity, setMultiplicity] = useState(6);
  const [evaluated, setEvaluated] = useState<TriggerState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    if (!event) return;
    setBusy(true);
    try {
      setEvaluated(await api.trigger(event.hits, window, multiplicity));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to evaluate trigger');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="instrument-card">
      <p className="eyebrow">ONLINE SELECTION / COINCIDENCE LOGIC</p>
      <h2 className="mt-1 text-lg font-semibold">Trigger Bench</h2>
      <div className="mt-5 space-y-4">
        <label className="block">
          <div className="flex justify-between text-xs text-muted">
            <span>Coincidence window</span><span>{window} ns</span>
          </div>
          <input
            type="range"
            min="50"
            max="1500"
            step="25"
            value={window}
            onChange={(change) => setWindow(Number(change.target.value))}
            className="mt-3 w-full accent-[#4de0c1]"
          />
        </label>
        <label className="block">
          <div className="flex justify-between text-xs text-muted">
            <span>Distinct channel cut</span><span>{multiplicity} PMTs</span>
          </div>
          <input
            type="range"
            min="2"
            max="24"
            value={multiplicity}
            onChange={(change) => setMultiplicity(Number(change.target.value))}
            className="mt-3 w-full accent-[#4de0c1]"
          />
        </label>
        <button
          onClick={() => void run()}
          disabled={!event || busy}
          className="secondary-button w-full disabled:opacity-40"
        >
          {busy ? 'Computing…' : 'Evaluate coincidence threshold'}
        </button>
        {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
        <div className="rounded-xl border border-white/10 bg-abyss p-4">
          <p className="eyebrow">SELECTION RESULT</p>
          <p className={`mt-2 text-xl font-semibold ${
            evaluated?.fired ? 'text-sea' : 'text-signal'
          }`}>
            {evaluated ? evaluated.fired ? 'COINCIDENCE' : 'BELOW CUT' : 'NOT EVALUATED'}
          </p>
          <p className="mt-2 text-xs text-muted">
            {evaluated
              ? `${evaluated.distinct_channels} unique channels in best window`
              : 'Modify thresholds to examine event selection.'}
          </p>
        </div>
      </div>
    </section>
  );
}
