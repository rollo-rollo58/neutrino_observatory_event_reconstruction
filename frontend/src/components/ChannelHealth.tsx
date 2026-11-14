import type { Detector } from '@/types/domain';

interface Props { detectors: Detector[] }

export default function ChannelHealth({ detectors }: Props) {
  const map = new Map(detectors.map((detector) => [
    `${detector.string_index}-${detector.level_index}`, detector,
  ]));
  const online = detectors.filter((detector) => detector.online).length;
  return (
    <section className="instrument-card">
      <p className="eyebrow">INSTRUMENT / ELECTRONICS STATUS</p>
      <h2 className="mt-1 text-lg font-semibold">Channel Health Matrix</h2>
      <p className="mt-2 text-xs text-muted">Eight strings · six depth levels</p>
      <div className="mt-4 grid grid-cols-8 gap-2">
        {Array.from({ length: 48 }, (_, index) => {
          const stringIndex = index % 8;
          const levelIndex = Math.floor(index / 8);
          const detector = map.get(`${stringIndex}-${levelIndex}`);
          return (
            <div
              key={index}
              title={detector
                ? `${detector.id}: ${detector.online ? 'online' : 'offline'}` : 'Unavailable'}
              className={`aspect-square rounded-md ${
                detector?.online ? 'bg-sea/70' : 'bg-slate-600/40'
              }`}
            />
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-between text-xs">
        <span className="text-muted">Operational sensors</span>
        <span className="font-semibold text-sea">{online} / {detectors.length || 48}</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-sea"
          style={{ width: `${detectors.length ? online / detectors.length * 100 : 0}%` }}
        />
      </div>
    </section>
  );
}
