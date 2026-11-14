import type { EventRecord } from '@/types/domain';

interface Props { event: EventRecord | null }

export default function AnalysisNarrative({ event }: Props) {
  const observations = event ? [
    {
      name: 'Coincidence requirement',
      passed: event.triggered,
      detail: `${event.multiplicity} unique PMTs in the triggered interval`,
    },
    {
      name: 'Fit residual screening',
      passed: event.rms_residual_ns < 20,
      detail: `${event.rms_residual_ns.toFixed(2)} ns RMS; illustrative 20 ns cut`,
    },
    {
      name: 'Numerical convergence',
      passed: event.converged,
      detail: `${event.iterations} optimizer rounds`,
    },
    {
      name: 'Charge above reference',
      passed: event.total_charge_pe > 15,
      detail: `${event.total_charge_pe.toFixed(1)} photoelectrons`,
    },
  ] : [];
  return (
    <section className="instrument-card">
      <p className="eyebrow">EVENT REVIEW / EXPLAINABLE CHECKS</p>
      <h2 className="mt-1 text-xl font-semibold">Candidate Qualification</h2>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Illustrative thresholds for scientific workflow testing, not real detection criteria.
      </p>
      {observations.length ? (
        <div className="mt-6 space-y-3">
          {observations.map((item) => (
            <div key={item.name} className="flex gap-3 rounded-xl bg-white/5 p-4">
              <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${
                item.passed ? 'bg-sea' : 'bg-signal'
              }`} />
              <div>
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="mt-1 text-xs text-muted">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-muted">
          Create a candidate event to populate these research checks.
        </p>
      )}
      <div className="mt-5 rounded-xl border border-signal/25 bg-signal/10 p-4">
        <p className="text-xs font-semibold text-signal">SCIENTIFIC CAUTION</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">
          Passing criteria does not imply neutrino identification or statistical discovery.
        </p>
      </div>
    </section>
  );
}
