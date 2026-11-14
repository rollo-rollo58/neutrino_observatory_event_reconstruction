'use client';

import { useMemo, useState } from 'react';
import type { Detector, EventRecord } from '@/types/domain';

interface Props {
  detectors: Detector[];
  event: EventRecord | null;
}

export default function DetectorArray({ detectors, event }: Props) {
  const [rotation, setRotation] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const amplitudes = useMemo(() => {
    const result = new Map<string, number>();
    event?.hits.forEach((hit) => {
      result.set(hit.channel_id, (result.get(hit.channel_id) || 0) + hit.raw_charge);
    });
    return result;
  }, [event]);
  const active = detectors.find((detector) => detector.id === selected);
  const rad = rotation * Math.PI / 180;

  return (
    <section className="instrument-card overflow-hidden shadow-sonar">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">SECTOR 01 / PHOTOMULTIPLIER GEOMETRY</p>
          <h2 className="mt-1 text-lg font-semibold">Detector Array</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted">Rotation</span>
          <input
            type="range"
            aria-label="Detector projection rotation"
            min="0"
            max="360"
            value={rotation}
            onChange={(change) => setRotation(Number(change.target.value))}
            className="w-24 accent-[#4de0c1]"
          />
          <span className="w-9 text-right text-xs text-sea">{rotation}°</span>
        </div>
      </div>
      <div className="relative rounded-xl border border-sea/10 bg-[#071722]">
        <svg viewBox="0 0 760 435" className="w-full" role="img">
          <title>Rotatable projection of 48 deep-water PMTs</title>
          <defs>
            <radialGradient id="water-volume">
              <stop offset="0" stopColor="#183d49" stopOpacity=".75" />
              <stop offset="1" stopColor="#071722" stopOpacity=".12" />
            </radialGradient>
            <pattern id="grid" width="38" height="38" patternUnits="userSpaceOnUse">
              <path d="M38 0H0V38" fill="none" stroke="#386070" strokeOpacity=".18" />
            </pattern>
          </defs>
          <rect width="760" height="435" fill="url(#grid)" />
          <ellipse cx="375" cy="218" rx="250" ry="186" fill="url(#water-volume)" />
          <ellipse cx="375" cy="81" rx="230" ry="56" fill="none" stroke="#315461" />
          <ellipse cx="375" cy="361" rx="230" ry="56" fill="none" stroke="#315461" />
          <path d="M145 81v280M605 81v280" stroke="#315461" strokeDasharray="6 6" />
          {Array.from({ length: 6 }, (_, index) => (
            <ellipse
              key={index}
              cx="375"
              cy={85 + index * 54}
              rx="230"
              ry="56"
              fill="none"
              stroke="#2b5560"
              strokeOpacity=".4"
              strokeDasharray="4 7"
            />
          ))}
          {detectors.map((detector) => {
            const x = detector.position.x * Math.cos(rad)
              - detector.position.y * Math.sin(rad);
            const depth = detector.position.x * Math.sin(rad)
              + detector.position.y * Math.cos(rad);
            const screenX = 375 + x * 2.55;
            const screenY = 222 - detector.position.z * 1.32 - 25 + depth * 0.22;
            const charge = amplitudes.get(detector.id) || 0;
            const radius = charge ? Math.min(12, 3 + Math.sqrt(charge) * 0.65) : 3.5;
            return (
              <g key={detector.id}>
                {charge > 0 && (
                  <circle
                    cx={screenX}
                    cy={screenY}
                    r={radius + 8}
                    fill="#f7b667"
                    opacity=".12"
                  />
                )}
                <circle
                  cx={screenX}
                  cy={screenY}
                  r={radius}
                  fill={charge > 0 ? '#f7b667' : detector.online ? '#4de0c1' : '#355667'}
                  stroke={selected === detector.id ? '#fff' : 'none'}
                  strokeWidth="2"
                  opacity={depth > 0 ? 1 : 0.65}
                  onClick={() => setSelected(detector.id)}
                  className="cursor-pointer"
                />
              </g>
            );
          })}
          <text x="26" y="38" fontSize="11" fill="#6e98a5">
            DEPTH / 120 m → -80 m
          </text>
          <text x="26" y="417" fontSize="11" fill="#6e98a5">
            LOCAL FRAME / 8 STRINGS × 6 LEVELS
          </text>
          <text x="618" y="38" fontSize="11" fill="#4de0c1">
            SAMPLED ARRAY
          </text>
        </svg>
        {active && (
          <div className="absolute bottom-4 right-4 rounded-xl border border-sea/30 bg-abyss/95 p-3">
            <p className="text-xs font-semibold text-sea">{active.id}</p>
            <p className="mt-1 text-[11px] text-muted">
              Gain {active.gain.toFixed(2)} / Dark rate {active.dark_rate_hz} Hz
            </p>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-5 text-xs text-muted">
        <span><b className="text-sea">●</b> Online PMTs</span>
        <span><b className="text-signal">●</b> Simulated photon hits</span>
        <span><b className="text-slate-500">●</b> Offline PMTs</span>
        <span className="ml-auto">Click channel to inspect · Drag rotation slider</span>
      </div>
    </section>
  );
}
