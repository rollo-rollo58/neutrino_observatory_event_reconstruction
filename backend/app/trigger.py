"""Coincidence triggering over unique PMTs and a sliding temporal window."""
from __future__ import annotations

from dataclasses import dataclass
from .schemas import PhotonHit


@dataclass(frozen=True)
class TriggerResult:
    fired: bool
    distinct_channels: int
    window_start_ns: float
    window_end_ns: float
    matched_channels: tuple[str, ...]


def coincidence_trigger(
    hits: list[PhotonHit],
    window_ns: float = 120.0,
    minimum_channels: int = 5,
) -> TriggerResult:
    if window_ns <= 0 or minimum_channels < 2:
        raise ValueError("invalid coincidence trigger settings")
    if not hits:
        return TriggerResult(False, 0, 0.0, 0.0, ())
    ordered = sorted(hits, key=lambda hit: hit.arrival_ns)
    counts: dict[str, int] = {}
    left = 0
    best: tuple[int, float, float, tuple[str, ...]] = (0, 0.0, 0.0, ())
    for right, hit in enumerate(ordered):
        counts[hit.channel_id] = counts.get(hit.channel_id, 0) + 1
        while ordered[right].arrival_ns - ordered[left].arrival_ns > window_ns:
            key = ordered[left].channel_id
            counts[key] -= 1
            if counts[key] == 0:
                del counts[key]
            left += 1
        if len(counts) > best[0]:
            best = (
                len(counts),
                ordered[left].arrival_ns,
                ordered[right].arrival_ns,
                tuple(sorted(counts)),
            )
    return TriggerResult(best[0] >= minimum_channels, *best)


def partition_bursts(hits: list[PhotonHit], silence_ns: float = 250.0) -> list[list[PhotonHit]]:
    if silence_ns <= 0:
        raise ValueError("silence threshold must be positive")
    ordered = sorted(hits, key=lambda hit: hit.arrival_ns)
    groups: list[list[PhotonHit]] = []
    for hit in ordered:
        if not groups or hit.arrival_ns - groups[-1][-1].arrival_ns > silence_ns:
            groups.append([])
        groups[-1].append(hit)
    return groups
