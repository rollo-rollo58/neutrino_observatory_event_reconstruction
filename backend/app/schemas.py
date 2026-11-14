"""Pydantic API contracts and domain-safe numerical bounds."""
from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field, field_validator
import math


class Vec3(BaseModel):
    x: float = Field(ge=-1000, le=1000)
    y: float = Field(ge=-1000, le=1000)
    z: float = Field(ge=-1000, le=1000)


class Detector(BaseModel):
    id: str
    string_index: int
    level_index: int
    position: Vec3
    gain: float = Field(gt=0, le=100)
    time_offset_ns: float = Field(ge=-5000, le=5000)
    dark_rate_hz: float = Field(ge=0, le=100000)
    online: bool = True


class PhotonHit(BaseModel):
    channel_id: str = Field(min_length=1, max_length=60)
    arrival_ns: float
    raw_charge: float = Field(ge=0, le=1000000)

    @field_validator("arrival_ns", "raw_charge")
    @classmethod
    def finite(cls, value: float) -> float:
        if not math.isfinite(value):
            raise ValueError("measurement must be finite")
        return value


class TriggerRequest(BaseModel):
    hits: list[PhotonHit] = Field(min_length=0, max_length=1000)
    window_ns: float = Field(default=120, gt=0, le=100000)
    minimum_channels: int = Field(default=5, ge=2, le=48)


class ReconstructionRequest(BaseModel):
    hits: list[PhotonHit] = Field(min_length=4, max_length=1000)
    iterations: int = Field(default=100, ge=5, le=400)


class SimulationRequest(BaseModel):
    seed: int = Field(default=42, ge=0, le=10000000)
    event_position: Vec3 = Field(default_factory=lambda: Vec3(x=8, y=-12, z=-25))
    light_yield: float = Field(default=90, ge=1, le=10000)
    jitter_ns: float = Field(default=2, ge=0, le=30)
    noise_hits: int = Field(default=2, ge=0, le=20)


class IngestionRequest(BaseModel):
    hits: list[PhotonHit] = Field(min_length=4, max_length=1000)
    source: Literal["calibration", "external_research"] = "external_research"


class CalibrationRequest(BaseModel):
    channel_id: str
    gain: float = Field(gt=0, le=100)
    time_offset_ns: float = Field(ge=-5000, le=5000)


class PolicyInput(BaseModel):
    signal: float = Field(default=22, ge=0, le=100000)
    background: float = Field(default=4, ge=0, le=100000)
    uncertainty: float = Field(default=1.5, ge=0, le=10000)
    baseline: float = Field(default=8, ge=-100000, le=100000)


class EventSummary(BaseModel):
    id: str
    created_at: str
    triggered: bool
    multiplicity: int
    total_charge_pe: float
    energy_proxy_gev: float
    rms_residual_ns: float
    vertex: Vec3
    kind: str
