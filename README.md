# Borealis Array — Neutrino Observatory Event Reconstruction

An independent full-stack research workbench for a simulated deep-water
photomultiplier (PMT) observatory. It provides coincidence triggers, photon
travel-time calculations, per-channel calibration, event reconstruction,
and a Next.js scientific operations console.

## Engineering status and scientific limits

**Research demonstrator only.** The detector coordinates, noise models,
photocathode calibration, effective attenuation, and selection rules are
synthetic. The vertex estimator is a simplified weighted time-residual
optimizer, not a validated neutrino-track fitter. It is not a real
high-energy-physics experiment, safety system, or discovery instrument.

The four policy catalogues are generated, executable, parameter-specific
screening functions. They are useful for code benchmarking and rule
exploration, but **do not represent 100,000 independent scientific insights**.

## System boundaries

- Python 3.12, FastAPI, Pydantic v2 and typed numerical domain services.
- Bounded asynchronous ingestion, API-key-protected calibration and ingress.
- PostgreSQL 16 relational schema, index-backed event queries, audit views.
- Bounded in-memory demo ledger and a separately supplied PostgreSQL schema.
- Next.js 15 App Router, TypeScript, Tailwind CSS, typed API and SSE client.
- Research visualization: water Cherenkov detector geometry, charge rings,
  waveform strips, first-hit event localization, and coincidence clusters.
- Kubernetes deployment examples, Prometheus rules, and GitHub Actions CI.

## Domain conventions and equations

- Coordinates: meters in a local detector frame, centered at (0, 0, 0).
- Photon propagation speed: c / n, in meters per nanosecond.
- Expected photon arrival: t_emit + distance(vertex, PMT) / speed.
- Calibrated photoelectrons: raw charge divided by channel gain.
- Trigger: at least M distinct PMTs inside a sliding coincidence window.
- Reconstruction: constrained, iteratively reweighted time-residual fit.
- Crude energy proxy: total calibrated photoelectrons / light-yield factor.
- Noise estimator: expected dark pulses = rate * observation duration.

The numerical assumptions are stated in the corresponding backend modules.
Results expose units, fit RMS residuals, convergence, and detector metadata.

## REST / streaming interface

| Method | Path | Semantics |
| --- | --- | --- |
| GET | `/health` | Liveness and synthetic-data mode |
| GET | `/api/v1/overview` | Counts and detector summary |
| GET | `/api/v1/detectors` | PMT geometry and channel status |
| GET | `/api/v1/events` | Bounded event ledger |
| GET | `/api/v1/events/{event_id}` | Event detail |
| POST | `/api/v1/simulate` | Seeded synthetic event reconstruction |
| POST | `/api/v1/trigger` | Coincidence trigger evaluation |
| POST | `/api/v1/reconstruct` | Fit from supplied calibrated hits |
| POST | `/api/v1/ingest` | Operator-key-protected event ingestion |
| POST | `/api/v1/calibrations` | Operator-key-protected calibration |
| GET | `/api/v1/policies/{family}/{policy_id}` | Synthetic case evaluation |
| GET | `/api/v1/stream` | Streaming synthetic activity via SSE |

For policies, use `?signal=22&background=4&uncertainty=1.5&baseline=8`.

## Quick start

Create a virtual environment and install the backend:

```sh
cd backend
python -m pip install -e '.[dev]'
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In a separate terminal:

```sh
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`. To enable write routes, set a long random
`OPERATOR_API_KEY` in the backend process. No key or credentials are committed.

## Database and deployments

The demo uses a bounded in-memory event ledger. For durable deployments,
connect a persistence adapter to the supplied PostgreSQL schema.
Run the SQL migrations in order (001 through 004) before allowing writes.
Set actual service credentials externally. `docker-compose.yml` is an example;
its database service uses `${POSTGRES_PASSWORD}` from the deployment shell.

## Testing and transparency

`cd backend && python -m pytest -q` runs physics, triggering, reconstruction,
calibration, route and security tests. Generation-time verification checks
archive integrity, file count, exact physical line count, line length,
UTF-8 text, prohibited paths, and candidate secret tokens. It compiles the
Python sources, type-parses TS/TSX, and executes samples of generated policies.

The large policy corpus consists of deterministic templates with distinct
thresholds, coefficients, acceptance windows, and mathematically complete
implementations. They must not be confused with separately authored modules.
Full production readiness requires instrument data, actual DB integration,
real auth/identity, observability, vulnerability scanning, model calibration,
and independent scientific review.
