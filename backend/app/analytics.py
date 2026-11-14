"""Small deterministic science analytics useful for UI presentations."""
from __future__ import annotations

from collections import Counter
import math
from .calibration import CalibratedHit
from .schemas import Detector


def detector_health_summary(detectors: dict[str, Detector]) -> dict[str, object]:
    online = sum(detector.online for detector in detectors.values())
    return {
        "total": len(detectors),
        "online": online,
        "offline": len(detectors) - online,
        "average_dark_rate_hz": round(
            sum(detector.dark_rate_hz for detector in detectors.values())
            / max(len(detectors), 1),
            1,
        ),
    }


def charge_histogram(hits: list[CalibratedHit], bins: int = 16) -> list[int]:
    if bins < 1 or bins > 256:
        raise ValueError("histogram requires 1 to 256 bins")
    if not hits:
        return [0] * bins
    maximum = max(hit.photoelectrons for hit in hits)
    step = max(maximum / bins, 1e-12)
    output = [0] * bins
    for hit in hits:
        index = min(int(hit.photoelectrons / step), bins - 1)
        output[index] += 1
    return output


def string_occupancy(hits: list[CalibratedHit]) -> dict[str, int]:
    counts = Counter(hit.channel_id.split("-")[1] for hit in hits)
    return {str(index): counts.get(str(index), 0) for index in range(8)}


def waveform_samples(hits: list[CalibratedHit], bins: int = 80) -> list[float]:
    if bins < 2 or bins > 200:
        raise ValueError("waveform length outside supported range")
    if not hits:
        return [0.0] * bins
    first = min(hit.arrival_ns for hit in hits)
    span = max(1.0, max(hit.arrival_ns for hit in hits) - first)
    waveform = [0.0] * bins
    for hit in hits:
        center = int((hit.arrival_ns - first) / span * (bins - 1))
        for index in range(max(0, center - 3), min(bins, center + 4)):
            waveform[index] += hit.photoelectrons * math.exp(
                -0.5 * ((index - center) / 1.4) ** 2
            )
    peak = max(waveform)
    return [round(value / peak, 4) for value in waveform] if peak > 0 else waveform
