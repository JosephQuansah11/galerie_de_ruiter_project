import pytest
from fastapi.testclient import TestClient

import app.main as main
from app.engines import DisabledEngine
from app.store import JobStore

POSITIONS = ("front", "back", "left", "right", "top", "bottom")


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(main, "store", JobStore(tmp_path))
    monkeypatch.setattr(main, "engine", DisabledEngine())
    monkeypatch.setattr(main.settings, "reconstruction_mode", "disabled")
    with TestClient(main.app) as test_client:
        yield test_client


def six_views(invalid_position=None):
    uploads = []
    for position in POSITIONS:
        content_type = "text/plain" if position == invalid_position else "image/jpeg"
        uploads.append(("images", (f"{position}.jpg", b"test-image", content_type)))
        uploads.append(("positions", (None, position)))
    return uploads


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["processing_available"] is False


def test_capabilities(client):
    response = client.get("/v1/capabilities")
    assert response.status_code == 200
    assert response.json()["accepts_multipart"] is True
    assert response.json()["processing_available"] is False
    assert response.json()["supported_input"] == {
        "min_images": 6,
        "recommended_images": 6,
        "max_images": 6,
    }


def test_rejects_unsupported_image(client, monkeypatch):
    monkeypatch.setattr(main.settings, "reconstruction_mode", "local")
    monkeypatch.setattr(main.settings, "local_engine_command", "configured")
    response = client.post("/v1/reconstructions", files=six_views("top"))
    assert response.status_code == 415


def test_disabled_engine_rejects_jobs_with_actionable_error(client):
    response = client.post("/v1/reconstructions", files=six_views())
    assert response.status_code == 503
    assert response.json()["detail"] == "Reconstruction processing is disabled."


def test_rejects_duplicate_view_positions(client, monkeypatch):
    monkeypatch.setattr(main.settings, "reconstruction_mode", "local")
    monkeypatch.setattr(main.settings, "local_engine_command", "configured")
    uploads = six_views()
    for index, item in enumerate(uploads):
        if item[0] == "positions" and item[1][1] == "back":
            uploads[index] = ("positions", (None, "front"))
    response = client.post("/v1/reconstructions", files=uploads)
    assert response.status_code == 400
