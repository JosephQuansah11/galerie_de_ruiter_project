# Reconstruction API

Standalone FastAPI service for image-to-3D reconstruction jobs.

## Modes

- `disabled` (default): accepts and records jobs, then reports that processing is unavailable. Recommended for Render web services without GPU workers.
- `local`: reserved for a local Meshroom/COLMAP runner.
- `external`: reserved for a separately managed GPU worker.

The API intentionally does not embed a paid reconstruction provider or credentials. The service contract is stable so a local or external engine can be added later.

## Run locally

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
$env:RECONSTRUCTION_MODE = "disabled"
uvicorn app.main:app --reload --port 8000
```

Endpoints:

- `GET /health`
- `GET /v1/capabilities`
- `POST /v1/reconstructions` with multipart `images` and optional `antique_id`
- `GET /v1/reconstructions/{job_id}`

The service accepts JPEG, PNG, and WEBP images. Six images are recommended for a future photogrammetry worker.

## Production

Render should run this API in `disabled` or `external` mode. Do not run Meshroom/COLMAP inside a normal Render web service. Use a GPU worker and object storage for production artifacts, then implement the `external` engine adapter.
