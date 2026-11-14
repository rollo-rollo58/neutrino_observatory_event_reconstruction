'use client';

import { useState } from 'react';
import type { Detector, EventRecord } from '@/types/domain';

interface Props {
  event: EventRecord | null;
  detectors: Detector[];
}

export default function GeometrySlices({ event, detectors }: Props) {
  const [plane, setPlane] = useState<'XY' | 'XZ'>('XY');
  const view = (axis: 'x' | 'y' | 'z') => axis === 'x' ? 'x' : axis;
  const point = (coordinates: { x: number; y: number; z: number }) => {
    const horizontal = coordinates.x;
    const vertical = plane === 'XY' ? coordinates.y : coordinates.z;
    return { x: 210 + horizontal * 1.12, y: 186 - vertical * 1.12 };
  };
  const vertex = event ? point(event.vertex) : null;
  const truth = event?.truth_vertex ? point(event.truth_vertex) : null;

  return (
    <section className="instrument-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">RECONSTRUCTION / SPATIAL PROJECTION</p>
          <h2 className="mt-1 text-xl font-semibold">Interaction Geometry</h2>
        </div>
        <div className="flex gap-1 rounded-lg border border-white/10 p-1">
          {(['XY', 'XZ'] as const).map((name) => (
            <button
              key={name}
              className={`rounded px-3 py-1 text-xs ${
                name === plane ? 'bg-sea text-abyss' : 'text-muted'
              }`}
              onClick={() => setPlane(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <svg viewBox="0 0 420 380" className="mt-3 w-full" role="img">
        <title>{plane} projection of detector channels and reconstructed vertex</title>
        {Array.from({ length: 9 }, (_, index) => (
          <g key={index} stroke="#31505d" strokeDasharray="3 8">
            <line x1={40 + index * 42} x2={40 + index * 42} y1="15" y2="353" />
            <line y1={17 + index * 42} y2={17 + index * 42} x1="28" x2="395" />
          </g>
        ))}
        <circle cx="210" cy="186" r="118" stroke="#2e6471" fill="none" />
        {detectors.map((detector) => {
          const position = point(detector.position);
          return (
            <circle
              key={detector.id}
              cx={position.x}
              cy={position.y}
              r="3.5"
              fill={detector.online ? '#5a9ba5' : '#2b4454'}
              opacity=".8"
            />
          );
        })}
        {truth && (
          <g>
            <circle cx={truth.x} cy={truth.y} r="9" stroke="#f7b667" fill="none" />
            <path
              d={`M${truth.x - 12} ${truth.y}h24 M${truth.x} ${truth.y - 12}v24`}
              stroke="#f7b667"
            />
          </g>
        )}
        {vertex && (
          <g>
            <circle cx={vertex.x} cy={vertex.y} r="14" stroke="#4de0c1" fill="none" />
            <circle cx={vertex.x} cy={vertex.y} r="4" fill="#4de0c1" />
          </g>
        )}
        <text x="26" y="374" fontSize="12" fill="#7895a6">
          {plane === 'XY' ? 'X–Y horizontal sensor geometry' : 'X–Z vertical sensor geometry'}
        </text>
      </svg>
      <p className="text-xs text-muted">
        <span className="text-sea">●</span> Fit vertex
        <span className="ml-5 text-signal">◎</span> Generator truth
      </p>
    </section>
  );
}
