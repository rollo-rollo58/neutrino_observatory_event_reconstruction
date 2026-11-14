'use client';

import { useState } from 'react';
import type { EventRecord, SimulationParams } from '@/types/domain';

interface Props {
  busy: boolean;
  onSimulate: (parameters: SimulationParams) => Promise<EventRecord | null>;
}

export default function EventControls({ busy, onSimulate }: Props) {
  const [seed, setSeed] = useState(47);
  const [yieldValue, setYieldValue] = useState(120);
  const [jitter, setJitter] = useState(2);
  const [noise, setNoise] = useState(2);
  const [vertexX, setVertexX] = useState(8);
  const [vertexY, setVertexY] = useState(-12);

  const simulate = () => onSimulate({
    seed,
    event_position: { x: vertexX, y: vertexY, z: -25 },
    light_yield: yieldValue,
    jitter_ns: jitter,
    noise_hits: noise,
  });
  return (
    <section className="instrument-card">
      <p className="eyebrow">INJECTION / CONTROLLED SYNTHETIC SIGNAL</p>
      <h2 className="mt-1 text-lg font-semibold">Event Injector</h2>
      <p className="mt-1 text-xs text-muted">
        Tune a reproducible light burst, then fit its arrival-time signature.
      </p>
      <div className="mt-5 space-y-4">
        {[
          { label: 'Light yield', value: yieldValue, set: setYieldValue,
            min: 20, max: 300, unit: 'a.u.' },
          { label: 'Timing jitter', value: jitter, set: setJitter,
            min: 0, max: 15, unit: 'ns' },
          { label: 'Noise pulses', value: noise, set: setNoise,
            min: 0, max: 20, unit: 'hits' },
        ].map((control) => (
          <label key={control.label} className="block">
            <div className="mb-2 flex justify-between text-xs">
              <span className="text-muted">{control.label}</span>
              <span className="font-semibold text-white">
                {control.value} {control.unit}
              </span>
            </div>
            <input
              type="range"
              min={control.min}
              max={control.max}
              value={control.value}
              onChange={(event) => control.set(Number(event.target.value))}
              className="w-full accent-[#4de0c1]"
            />
          </label>
        ))}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'X', value: vertexX, set: setVertexX },
            { label: 'Y', value: vertexY, set: setVertexY },
            { label: 'Seed', value: seed, set: setSeed },
          ].map((field) => (
            <label key={field.label} className="block text-[11px] text-muted">
              {field.label}
              <input
                type="number"
                value={field.value}
                min={field.label === 'Seed' ? 0 : -100}
                max={field.label === 'Seed' ? 10000000 : 100}
                onChange={(event) => field.set(Number(event.target.value))}
                className="mt-1 w-full rounded-lg border border-white/10 bg-abyss p-2 text-white"
              />
            </label>
          ))}
        </div>
        <button
          className="action-button w-full disabled:cursor-wait disabled:opacity-40"
          disabled={busy}
          onClick={() => void simulate()}
        >
          {busy ? 'Calculating arrival field…' : 'Generate & reconstruct event →'}
        </button>
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-muted">
        Emitted photons and dark noise are software-generated only.
      </p>
    </section>
  );
}
