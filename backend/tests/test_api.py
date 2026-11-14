"""API contract, malformed input, read/write separation and registry tests."""
from __future__ import annotations

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["mode"] == "synthetic_research"


def test_overview_and_detector_list():
    overview = client.get("/api/v1/overview")
    assert overview.status_code == 200
    assert overview.json()["channels"]["total"] == 48
    assert len(client.get("/api/v1/detectors").json()) == 48


def test_simulation_response_includes_vertex_and_residual():
    response = client.post("/api/v1/simulate", json={"seed": 63, "noise_hits": 0})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["id"]
    assert body["vertex"]["x"] is not None
    assert body["rms_residual_ns"] >= 0
    assert len(body["waveform"]) == 80


def test_empty_trigger_does_not_fire():
    response = client.post("/api/v1/trigger", json={"hits": []})
    assert response.status_code == 200
    assert not response.json()["fired"]


def test_unknown_event_has_404():
    assert client.get("/api/v1/events/not-found").status_code == 404


def test_operator_ingress_fail_closed_when_key_is_missing():
    response = client.post("/api/v1/ingest", json={"hits": []})
    assert response.status_code in (403, 422, 503)
    response = client.post(
        "/api/v1/calibrations",
        json={"channel_id": "PMT-0-0", "gain": 1.01, "time_offset_ns": 0},
    )
    assert response.status_code in (403, 503)


def test_policy_registry_returns_executable_scoring():
    response = client.get("/api/v1/policies/time/17")
    assert response.status_code == 200
    assert isinstance(response.json()["result"]["accepted"], bool)
    assert response.json()["calibrated"] is False


def test_policy_registry_rejects_unknown_family():
    assert client.get("/api/v1/policies/unknown/1").status_code == 404
    assert client.get("/api/v1/policies/time/2000").status_code == 404


def test_reconstruction_rejects_unknown_channels():
    hit = {"channel_id": "UNREGISTERED", "arrival_ns": 1, "raw_charge": 3}
    response = client.post("/api/v1/reconstruct", json={"hits": [hit] * 4})
    assert response.status_code == 422
