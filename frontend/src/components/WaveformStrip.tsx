import type { EventRecord } from '@/types/domain';

interface Props { event: EventRecord | null }

export default function WaveformStrip({ event }: Props) {
  const waveform = event?.waveform || [];
  const width = 900;
  const height = 165;
  const points = waveform.map((value, index) => {
    const x = 28 + index * (width - 58) / Math.max(1, waveform.length - 1);
    return `${x.toFixed(2)},${(height - 24 - value * 113).toFixed(2)}`;
  }).join(' ');
  return (
    <section className="instrument-card">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">INSTRUMENT / INTEGRATED PULSE SHAPE</p>
          <h2 className="mt-1 text-lg font-semibold">Photon Arrival Waveform</h2>
        </div>
        <span className="text-xs text-muted">Normalized integrated charge</span>
      </div>
      <svg viewBox="0 0 900 165" className="w-full" role="img">
        <title>Integrated temporal photon charge waveform</title>
        {Array.from({ length: 5 }, (_, index) => (
          <g key={index}>
            <line
              x1="27"
              x2="872"
              y1={20 + index * 30}
              y2={20 + index * 30}
              stroke="#31505d"
              strokeDasharray="3 7"
            />
          </g>
        ))}
        <defs>
          <linearGradient id="wave-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4de0c1" stopOpacity=".24" />
            <stop offset="1" stopColor="#4de0c1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {waveform.length > 0 ? (
          <>
            <polygon points={`28,142 ${points} 872,142`} fill="url(#wave-fill)" />
            <polyline points={points} fill="none" stroke="#4de0c1" strokeWidth="2.6" />
          </>
        ) : (
          <text x="320" y="83" fontSize="14" fill="#7895a6">
            Generate an event to populate the waveform
          </text>
        )}
        <text x="30" y="160" fontSize="10" fill="#7895a6">FIRST PHOTON</text>
        <text x="772" y="160" fontSize="10" fill="#7895a6">LAST PHOTON</text>
      </svg>
    </section>
  );
}
