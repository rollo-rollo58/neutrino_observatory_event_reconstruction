"""Explicitly bounded detector calibration and photoelectron conversion."""
from __future__ import annotations

from dataclasses import replace, dataclass
import math
from .schemas import Detector, PhotonHit


@dataclass(frozen=True)
class CalibratedHit:
    channel_id: str
    arrival_ns: float
    photoelectrons: float


def calibrate_hit(hit: PhotonHit, detector: Detector) -> CalibratedHit:
    if hit.channel_id != detector.id:
        raise ValueError("channel and detector identifiers differ")
    if not detector.online:
        raise ValueError("offline detector cannot contribute to reconstruction")
    corrected_time = hit.arrival_ns - detector.time_offset_ns
    return CalibratedHit(
        channel_id=hit.channel_id,
        arrival_ns=corrected_time,
        photoelectrons=hit.raw_charge / detector.gain,
    )


def robust_gain_estimate(raw_pulses: list[float], reference_pe: float) -> float:
    if not raw_pulses or reference_pe <= 0:
        raise ValueError("positive reference and nonempty pulses are required")
    if any(not math.isfinite(value) or value <= 0 for value in raw_pulses):
        raise ValueError("pulse charges must be positive finite numbers")
    samples = sorted(raw_pulses)
    midpoint = len(samples) // 2
    median = samples[midpoint] if len(samples) % 2 else (
        samples[midpoint - 1] + samples[midpoint]
    ) / 2
    return median / reference_pe


def calibration_drift(new_gain: float, baseline_gain: float) -> float:
    if baseline_gain <= 0 or new_gain <= 0:
        raise ValueError("positive gains are required")
    return 100.0 * (new_gain - baseline_gain) / baseline_gain
