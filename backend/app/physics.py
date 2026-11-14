"""Transparent simplified optics and Cherenkov-light proxies."""
from __future__ import annotations

import math
from .schemas import Vec3

VACUUM_LIGHT_SPEED_M_PER_NS = 0.299792458
WATER_REFRACTIVE_INDEX = 1.33
PHOTON_SPEED_M_PER_NS = VACUUM_LIGHT_SPEED_M_PER_NS / WATER_REFRACTIVE_INDEX
LIGHT_YIELD_PE_PER_GEV = 140.0


def distance_m(first: Vec3, second: Vec3) -> float:
    return math.dist((first.x, first.y, first.z), (second.x, second.y, second.z))


def travel_time_ns(first: Vec3, second: Vec3) -> float:
    return distance_m(first, second) / PHOTON_SPEED_M_PER_NS


def optical_transmission(distance: float, attenuation_length: float = 64.0) -> float:
    if not math.isfinite(distance) or distance < 0:
        raise ValueError("distance must be finite and nonnegative")
    if attenuation_length <= 0 or not math.isfinite(attenuation_length):
        raise ValueError("attenuation length must be finite and positive")
    return math.exp(-distance / attenuation_length)


def energy_proxy_gev(charge_pe: float) -> float:
    if not math.isfinite(charge_pe) or charge_pe < 0:
        raise ValueError("charge must be finite and nonnegative")
    return charge_pe / LIGHT_YIELD_PE_PER_GEV


def expected_noise_pulses(dark_rate_hz: float, duration_ns: float) -> float:
    if min(dark_rate_hz, duration_ns) < 0:
        raise ValueError("noise input must be nonnegative")
    return dark_rate_hz * duration_ns * 1e-9


def poisson_zero_probability(expected_pulses: float) -> float:
    if expected_pulses < 0 or not math.isfinite(expected_pulses):
        raise ValueError("expected pulses must be nonnegative and finite")
    return math.exp(-expected_pulses)
