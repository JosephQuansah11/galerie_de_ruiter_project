from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'

def test_capabilities():
    response = client.get('/v1/capabilities')
    assert response.status_code == 200
    assert response.json()['accepts_multipart'] is True

def test_rejects_unsupported_image():
    response = client.post('/v1/reconstructions', files={'images': ('file.txt', b'nope', 'text/plain')})
    assert response.status_code == 415

def test_creates_disabled_job():
    response = client.post('/v1/reconstructions', files={'images': ('item.jpg', b'jpeg-bytes', 'image/jpeg')})
    assert response.status_code == 201
    assert response.json()['status'] == 'queued'
    job = client.get(f"/v1/reconstructions/{response.json()['job_id']}")
    assert job.status_code == 200
