import type { EventRecord } from '@/types/domain';

interface Props {
  events: EventRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function EventLedger({ events, selectedId, onSelect }: Props) {
  return (
    <section className="instrument-card">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">ACQUISITION / RESEARCH EVENT LEDGER</p>
          <h2 className="mt-1 text-lg font-semibold">Reconstructed Candidates</h2>
        </div>
        <span className="text-xs text-muted">Most recent first</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-white/10 text-muted">
            <tr>
              <th className="pb-3 font-medium">EVENT ID</th>
              <th className="pb-3 font-medium">TRIGGER</th>
              <th className="pb-3 font-medium">PMT COUNT</th>
              <th className="pb-3 font-medium">ENERGY PROXY</th>
              <th className="pb-3 font-medium">FIT RMS</th>
            </tr>
          </thead>
          <tbody>
            {events.slice(0, 9).map((event) => (
              <tr
                key={event.id}
                onClick={() => onSelect(event.id)}
                className={`cursor-pointer border-b border-white/5 transition-colors ${
                  selectedId === event.id ? 'bg-sea/10' : 'hover:bg-white/5'
                }`}
              >
                <td className="py-3 font-mono text-sea">{event.id.slice(0, 8)}</td>
                <td className="py-3">
                  <span className={event.triggered ? 'text-sea' : 'text-signal'}>
                    {event.triggered ? 'COINCIDENT' : 'BELOW CUT'}
                  </span>
                </td>
                <td className="py-3">{event.multiplicity}</td>
                <td className="py-3">{event.energy_proxy_gev.toFixed(2)} GeV</td>
                <td className="py-3">{event.rms_residual_ns.toFixed(1)} ns</td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            No candidates yet. Generate a synthetic event to begin.
          </p>
        )}
      </div>
    </section>
  );
}
