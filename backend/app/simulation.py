"""Seedable detector and synthetic event generation; never real instrument data."""
from __future__ import annotations

import math
import random
from .physics import optical_transmission, travel_time_ns
from .schemas import Detector, PhotonHit, SimulationRequest, Vec3


def build_detector_array() -> dict[str, Detector]:
    detectors: dict[str, Detector] = {}
    for string_index in range(8):
        angle = string_index * math.tau / 8
        for level_index in range(6):
            position = Vec3(
                x=90 * math.cos(angle),
                y=90 * math.sin(angle),
                z=-120 + 40 * level_index,
            )
            identifier = f"PMT-{string_index}-{level_index}"
            detectors[identifier] = Detector(
                id=identifier,
                string_index=string_index,
                level_index=level_index,
                position=position,
                gain=1.0 + 0.03 * ((string_index + level_index) % 4),
                time_offset_ns=0.4 * (level_index - 3),
                dark_rate_hz=400 + 25 * string_index,
                online=(string_index, level_index) not in {(2, 3), (6, 0)},
            )
    return detectors


def synthetic_hits(
    request: SimulationRequest,
    detectors: dict[str, Detector],
) -> list[PhotonHit]:
    randomizer = random.Random(request.seed)
    hits: list[PhotonHit] = []
    for detector in detectors.values():
        if not detector.online:
            continue
        distance = math.dist(
            (request.event_position.x, request.event_position.y, request.event_position.z),
            (detector.position.x, detector.position.y, detector.position.z),
        )
        expected_charge = (
            request.light_yield * optical_transmission(distance) * 85.0
            / (50.0 + 0.012 * distance * distance)
        )
        if expected_charge < 0.9:
            continue
        charge = max(0.01, randomizer.gauss(expected_charge, 0.07 * expected_charge))
        time_ns = 1200 + travel_time_ns(request.event_position, detector.position)
        hits.append(PhotonHit(
            channel_id=detector.id,
            arrival_ns=time_ns + detector.time_offset_ns
            + randomizer.gauss(0, request.jitter_ns),
            raw_charge=charge * detector.gain,
        ))
    online = [det for det in detectors.values() if det.online]
    for _ in range(request.noise_hits):
        detector = randomizer.choice(online)
        hits.append(PhotonHit(
            channel_id=detector.id,
            arrival_ns=randomizer.uniform(300, 2300),
            raw_charge=randomizer.uniform(0.01, 0.2),
        ))
    return sorted(hits, key=lambda hit: hit.arrival_ns)
