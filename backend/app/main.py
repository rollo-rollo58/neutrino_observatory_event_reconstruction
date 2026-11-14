"""Borealis Array HTTP research API and server-sent event endpoint."""
from __future__ import annotations

from dataclasses import replace
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .analytics import charge_histogram, detector_health_summary, waveform_samples
from .calibration import calibrate_hit
from .config import settings
from .physics import energy_proxy_gev
from .reconstruction import reconstruct_vertex
from .repository import ledger
from .schemas import (
    CalibrationRequest,
    IngestionRequest,
    PolicyInput,
    ReconstructionRequest,
    SimulationRequest,
    TriggerRequest,
)
from .security import require_operator
from .simulation import build_detector_array, synthetic_hits
from .stream import stream_activity
from .trigger import coincidence_trigger
from . import policies_charge, policies_geometry, policies_noise, policies_time

app = FastAPI(
    title="Borealis Array Neutrino Research API",
    version="0.1.0",
    description="Synthetic detector research; not validated experimental instrumentation",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["X-Operator-Key", "Content-Type"],
)
detectors = build_detector_array()
policy_families = {
    "time": policies_time,
    "charge": policies_charge,
    "noise": policies_noise,
    "geometry": policies_geometry,
}


def _calibrate(hits: list[Any]):
    invalid = sorted({hit.channel_id for hit in hits if hit.channel_id not in detectors})
    if invalid:
        raise HTTPException(status_code=422, detail=f"unknown PMTs: {invalid[:6]}")
    return [
        calibrate_hit(hit, detectors[hit.channel_id])
        for hit in hits
        if detectors[hit.channel_id].online
    ]


def _analyze(hits: list[Any], iterations: int = 100) -> dict[str, Any]:
    calibrated = _calibrate(hits)
    physics_hits = [hit for hit in calibrated if hit.photoelectrons >= 0.5]
    if len({hit.channel_id for hit in physics_hits}) < 4:
        raise HTTPException(status_code=422, detail="insufficient useful PMT hits")
    try:
        fit = reconstruct_vertex(physics_hits, detectors, iterations)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    trigger = coincidence_trigger(hits, window_ns=850, minimum_channels=6)
    return {
        "triggered": trigger.fired,
        "multiplicity": trigger.distinct_channels,
        "total_charge_pe": round(sum(hit.photoelectrons for hit in physics_hits), 4),
        "energy_proxy_gev": round(fit.energy_proxy_gev, 4),
        "rms_residual_ns": round(fit.rms_residual_ns, 4),
        "vertex": fit.vertex.model_dump(),
        "emission_time_ns": round(fit.emission_time_ns, 4),
        "converged": fit.converged,
        "iterations": fit.iterations,
        "kind": "synthetic_research",
        "waveform": waveform_samples(physics_hits),
        "charge_histogram": charge_histogram(physics_hits),
        "hits": [hit.model_dump() for hit in hits],
        "matched_channels": list(trigger.matched_channels),
    }


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "synthetic_research"}


@app.get("/api/v1/detectors")
def list_detectors() -> list[dict[str, Any]]:
    return [detector.model_dump() for detector in detectors.values()]


@app.get("/api/v1/overview")
async def overview() -> dict[str, Any]:
    return {
        "mode": "synthetic_research",
        "experiment": "Borealis deep-water PMT array",
        "channels": detector_health_summary(detectors),
        "recorded_events": await ledger.count(),
        "policy_families": list(policy_families),
        "policy_cases_per_family": 1400,
    }


@app.get("/api/v1/events")
async def list_events(limit: int = Query(default=25, ge=1, le=100)):
    return await ledger.list(limit)


@app.get("/api/v1/events/{event_id}")
async def get_event(event_id: str):
    found = await ledger.get(event_id)
    if found is None:
        raise HTTPException(status_code=404, detail="event does not exist")
    return found


@app.post("/api/v1/trigger")
def evaluate_trigger(request: TriggerRequest):
    result = coincidence_trigger(
        request.hits,
        request.window_ns,
        request.minimum_channels,
    )
    return {
        "fired": result.fired,
        "distinct_channels": result.distinct_channels,
        "window_start_ns": result.window_start_ns,
        "window_end_ns": result.window_end_ns,
        "matched_channels": result.matched_channels,
    }


@app.post("/api/v1/reconstruct")
def reconstruct(request: ReconstructionRequest):
    return _analyze(request.hits, request.iterations)


@app.post("/api/v1/simulate")
async def simulate(request: SimulationRequest):
    hits = synthetic_hits(request, detectors)
    result = _analyze(hits)
    result["truth_vertex"] = request.event_position.model_dump()
    result["kind"] = "synthetic_research"
    saved = await ledger.append(result)
    return saved


@app.post("/api/v1/ingest")
async def ingest(request: IngestionRequest, operator: str = Depends(require_operator)):
    result = _analyze(request.hits)
    result["kind"] = "ingested_research"
    result["source"] = request.source
    result["operator"] = operator
    return await ledger.append(result)


@app.post("/api/v1/calibrations")
def update_calibration(
    request: CalibrationRequest,
    operator: str = Depends(require_operator),
):
    current = detectors.get(request.channel_id)
    if current is None:
        raise HTTPException(status_code=404, detail="unknown channel")
    revised = current.model_copy(update={
        "gain": request.gain,
        "time_offset_ns": request.time_offset_ns,
    })
    detectors[request.channel_id] = revised
    return {"channel": revised.model_dump(), "updated_by": operator}


@app.get("/api/v1/policies/{family}/{policy_id}")
def evaluate_policy(
    family: str,
    policy_id: int,
    signal: float = Query(default=22, ge=0, le=100000),
    background: float = Query(default=4, ge=0, le=100000),
    uncertainty: float = Query(default=1.5, ge=0, le=10000),
    baseline: float = Query(default=8, ge=-100000, le=100000),
):
    module = policy_families.get(family)
    if module is None or not 0 <= policy_id < 1400:
        raise HTTPException(status_code=404, detail="policy case not found")
    payload = PolicyInput(
        signal=signal,
        background=background,
        uncertainty=uncertainty,
        baseline=baseline,
    )
    evaluator = getattr(module, f"policy_{policy_id:04d}")
    return {
        "family": family,
        "policy_id": policy_id,
        "result": evaluator(**payload.model_dump()),
        "calibrated": False,
    }


@app.get("/api/v1/stream")
async def stream():
    return StreamingResponse(
        stream_activity(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
