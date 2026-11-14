import type { Detector, EventRecord } from '@/types/domain';

interface Props {
  event: EventRecord | null;
  detectors: Detector[];
}

const PHOTON_SPEED_M_PER_NS = 0.299792458 / 1.33;

export default function TimeResiduals({ event, detectors }: Props) {
  const index = new Map(detectors.map((detector) => [detector.id, detector]));
  const residuals = (event?.hits || []).flatMap((hit) => {
    const detector = index.get(hit.channel_id);
    if (!detector || !event || !detector.online) return [];
    const distance = Math.hypot(
      event.vertex.x - detector.position.x,
      event.vertex.y - detector.position.y,
      event.vertex.z - detector.position.z,
    );
    const prediction = event.emission_time_ns + distance / PHOTON_SPEED_M_PER_NS;
    return [{ id: hit.channel_id, residual: hit.arrival_ns
      - detector.time_offset_ns - prediction }];
  });
  const visible = residuals.slice(0, 42);
  const magnitude = Math.max(5, ...visible.map((item) => Math.abs(item.residual)));
  return (
    <section className="instrument-card">
      <p className="eyebrow">RECONSTRUCTION / TIMING QUALITY</p>
      <h2 className="mt-1 text-xl font-semibold">Photon Time Residuals</h2>
      <div className="mt-5 rounded-xl border border-white/5 bg-abyss p-2">
        <svg viewBox="0 0 580 245" className="w-full" role="img">
          <title>Photon arrival residuals relative to fitted vertex</title>
          <line x1="34" x2="555" y1="122" y2="122" stroke="#688692" />
          <line x1="34" x2="555" y1="20" y2="20" stroke="#294655" />
          <line x1="34" x2="555" y1="225" y2="225" stroke="#294655" />
          {visible.map((item, index) => (
            <line
              key={`${item.id}-${index}`}
              x1={38 + index * 510 / Math.max(1, visible.length - 1)}
              x2={38 + index * 510 / Math.max(1, visible.length - 1)}
              y1="122"
              y2={122 - Math.max(-100, Math.min(100, item.residual / magnitude * 97))}
              stroke={Math.abs(item.residual) > 20 ? '#f7b667' : '#4de0c1'}
              strokeWidth="5"
              strokeLinecap="round"
            />
          ))}
          <text x="36" y="14" fontSize="11" fill="#7895a6">
            +{magnitude.toFixed(0)} ns
          </text>
          <text x="36" y="239" fontSize="11" fill="#7895a6">
            -{magnitude.toFixed(0)} ns
          </text>
          <text x="476" y="116" fontSize="11" fill="#7895a6">0 ns</text>
        </svg>
      </div>
      <p className="mt-3 text-xs text-muted">
        Large residuals may reflect dark noise, model mismatch, or incomplete calibration.
      </p>
    </section>
  );
}
