import type { EventRecord } from '@/types/domain';

interface Props { event: EventRecord | null }

export default function VertexReconstruction({ event }: Props) {
  const vertex = event?.vertex;
  const truth = event?.truth_vertex;
  const offset = vertex && truth ? Math.hypot(
    vertex.x - truth.x,
    vertex.y - truth.y,
    vertex.z - truth.z,
  ) : null;
  return (
    <section className="instrument-card">
      <p className="eyebrow">RECONSTRUCTION / TIME-OF-FLIGHT SOLUTION</p>
      <h2 className="mt-2 text-xl font-semibold">Fitted Interaction Vertex</h2>
      <p className="mt-1 text-xs text-muted">
        Iteratively reweighted 4-parameter geometric timing fit.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {(['x', 'y', 'z'] as const).map((axis) => (
          <div key={axis} className="rounded-xl border border-white/10 bg-abyss p-4">
            <p className="eyebrow">{axis.toUpperCase()} POSITION</p>
            <p className="mt-3 text-xl font-medium text-sea">
              {vertex ? vertex[axis].toFixed(2) : '—'}
              <span className="ml-1 text-xs text-muted">m</span>
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white/5 p-4">
          <p className="eyebrow">TIME RESIDUAL RMS</p>
          <p className="mt-2 text-xl">
            {event ? event.rms_residual_ns.toFixed(2) : '—'} ns
          </p>
        </div>
        <div className="rounded-xl bg-white/5 p-4">
          <p className="eyebrow">FIT STATUS</p>
          <p className="mt-2 text-xl">
            {event ? event.converged ? 'Converged' : 'Iteration limit' : '—'}
          </p>
        </div>
        <div className="rounded-xl bg-white/5 p-4">
          <p className="eyebrow">SOLVER ITERATIONS</p>
          <p className="mt-2 text-xl">{event?.iterations ?? '—'}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-4">
          <p className="eyebrow">TRUTH SEPARATION</p>
          <p className="mt-2 text-xl">
            {offset !== null ? `${offset.toFixed(2)} m` : '—'}
          </p>
        </div>
      </div>
      <p className="mt-4 text-[11px] leading-relaxed text-muted">
        Measured separation is available only for generated events with known truth coordinates.
      </p>
    </section>
  );
}
