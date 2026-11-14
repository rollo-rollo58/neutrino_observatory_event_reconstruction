"""Physics, trigger, calibration, simulation and reconstruction tests."""
from __future__ import annotations

import math
import pytest
from app.analytics import charge_histogram, detector_health_summary, waveform_samples
from app.calibration import calibrate_hit, calibration_drift, robust_gain_estimate
from app.physics import (
    PHOTON_SPEED_M_PER_NS,
    energy_proxy_gev,
    expected_noise_pulses,
    optical_transmission,
    travel_time_ns,
)
from app.reconstruction import reconstruct_vertex
from app.schemas import PhotonHit, SimulationRequest, Vec3
from app.simulation import build_detector_array, synthetic_hits
from app.trigger import coincidence_trigger, partition_bursts


def test_photon_speed_in_water_is_below_vacuum_speed():
    assert 0 < PHOTON_SPEED_M_PER_NS < 0.299792458


def test_photon_time_for_known_distance():
    first = Vec3(x=0, y=0, z=0)
    second = Vec3(x=0, y=0, z=10)
    assert travel_time_ns(first, second) == pytest.approx(10 / PHOTON_SPEED_M_PER_NS)


def test_optical_transmission_is_bounded():
    assert optical_transmission(0) == 1
    assert 0 < optical_transmission(50) < 1
    with pytest.raises(ValueError):
        optical_transmission(-1)


def test_noise_and_energy_units():
    assert expected_noise_pulses(1000, 1e9) == pytest.approx(1000)
    assert energy_proxy_gev(280) == 2


def test_trigger_requires_distinct_channels():
    duplicate_hits = [
        PhotonHit(channel_id="PMT-0-0", arrival_ns=i, raw_charge=1)
        for i in range(8)
    ]
    result = coincidence_trigger(duplicate_hits, window_ns=10, minimum_channels=3)
    assert result.fired is False
    assert result.distinct_channels == 1


def test_trigger_fires_for_multi_channel_burst():
    hits = [
        PhotonHit(channel_id=f"PMT-{i}-0", arrival_ns=i * 3, raw_charge=2)
        for i in range(6)
    ]
    result = coincidence_trigger(hits, 30, 5)
    assert result.fired
    assert result.distinct_channels == 6


def test_burst_partition_detects_gaps():
    hits = [
        PhotonHit(channel_id=f"PMT-{i}-0", arrival_ns=t, raw_charge=1)
        for i, t in enumerate((0, 7, 15, 800))
    ]
    assert [len(group) for group in partition_bursts(hits)] == [3, 1]


def test_detector_array_geometry_and_offline_state():
    detectors = build_detector_array()
    assert len(detectors) == 48
    assert detector_health_summary(detectors)["online"] == 46


def test_simulation_reproducible_for_same_seed():
    request = SimulationRequest(seed=143)
    detectors = build_detector_array()
    assert synthetic_hits(request, detectors) == synthetic_hits(request, detectors)


def test_calibration_corrects_gain_and_time():
    detector = build_detector_array()["PMT-0-0"]
    sample = PhotonHit(channel_id=detector.id, arrival_ns=800, raw_charge=10)
    result = calibrate_hit(sample, detector)
    assert result.photoelectrons == pytest.approx(10 / detector.gain)
    assert result.arrival_ns == pytest.approx(800 - detector.time_offset_ns)


def test_calibration_robust_median_and_drift():
    assert robust_gain_estimate([10, 12, 12, 13, 900], 4) == 3
    assert calibration_drift(1.1, 1.0) == pytest.approx(10)


def test_reconstruction_with_synthetic_event():
    request = SimulationRequest(seed=17, jitter_ns=0.1, noise_hits=0)
    detectors = build_detector_array()
    hits = synthetic_hits(request, detectors)
    calibrated = [calibrate_hit(hit, detectors[hit.channel_id]) for hit in hits]
    fit = reconstruct_vertex(calibrated, detectors)
    assert fit.fitted_hits >= 12
    assert math.isfinite(fit.rms_residual_ns)
    assert fit.energy_proxy_gev > 0
    assert -200 <= fit.vertex.x <= 200


def test_reconstruction_rejects_underdetermined_geometry():
    detectors = build_detector_array()
    sample = PhotonHit(channel_id="PMT-0-0", arrival_ns=500, raw_charge=2)
    hits = [calibrate_hit(sample, detectors[sample.channel_id])]
    with pytest.raises(ValueError):
        reconstruct_vertex(hits, detectors)


def test_charge_histogram_preserves_total_hits():
    detectors = build_detector_array()
    request = SimulationRequest(seed=123)
    hits = synthetic_hits(request, detectors)
    calibrated = [calibrate_hit(hit, detectors[hit.channel_id]) for hit in hits]
    assert sum(charge_histogram(calibrated)) == len(calibrated)
    assert max(waveform_samples(calibrated)) == 1
