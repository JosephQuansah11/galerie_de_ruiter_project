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


def test_capabilities(client):
    response = client.get("/v1/capabilities")
    assert response.status_code == 200
    assert response.json()["accepts_multipart"] is True


def test_rejects_unsupported_image(client):
    response = client.post("/v1/reconstructions", files=six_views("top"))
    assert response.status_code == 415


def test_creates_job_and_processes_disabled_engine(client):
    response = client.post("/v1/reconstructions", files=six_views())
    assert response.status_code == 201
    assert response.json()["status"] == "queued"
    job = client.get(f"/v1/reconstructions/{response.json()['job_id']}")
    assert job.status_code == 200
    assert job.json()["status"] == "processing_disabled"
