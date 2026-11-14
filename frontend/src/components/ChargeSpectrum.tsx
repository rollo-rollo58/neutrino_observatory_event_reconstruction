import type { EventRecord } from '@/types/domain';

interface Props { event: EventRecord | null }

export default function ChargeSpectrum({ event }: Props) {
  const bins = event?.charge_histogram || Array.from({ length: 16 }, () => 0);
  const peak = Math.max(1, ...bins);
  return (
    <section className="instrument-card">
      <p className="eyebrow">CALIBRATION / PULSE HEIGHT DISTRIBUTION</p>
      <h2 className="mt-1 text-xl font-semibold">Photoelectron Spectrum</h2>
      <div className="mt-5 flex h-56 items-end gap-1.5 border-b border-white/10 pb-2">
        {bins.map((count, index) => (
          <div
            key={index}
            className="group relative flex flex-1 items-end"
            style={{ height: '100%' }}
          >
            <div
              className="w-full rounded-t bg-gradient-to-t from-[#195e62] to-sea"
              style={{ height: `${Math.max(count ? 2 : 0, count / peak * 100)}%` }}
              title={`Charge bin ${index + 1}: ${count} hits`}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-[11px] text-muted">
        <span>LOW CHARGE</span>
        <span>HIGH CHARGE</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white/5 p-3">
          <p className="eyebrow">CALIBRATED CHARGE</p>
          <p className="mt-2 text-lg text-white">
            {event ? event.total_charge_pe.toFixed(1) : '—'} pe
          </p>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="eyebrow">ROUGH ENERGY</p>
          <p className="mt-2 text-lg text-white">
            {event ? event.energy_proxy_gev.toFixed(2) : '—'} GeV
          </p>
        </div>
      </div>
    </section>
  );
}
