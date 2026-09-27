# Reconstruction API

Standalone FastAPI service for image-to-3D reconstruction jobs.

## Modes

- `disabled` (default): accepts and records jobs, then reports that processing is unavailable. Recommended for Render web services without GPU workers.
- `local`: runs a configured Meshroom/COLMAP command and serves its `.glb`/`.gltf` output.
- `external`: submits the six images to a separately managed GPU worker and stores the returned model URL.

The API intentionally does not embed a paid reconstruction provider or credentials.

## Run locally

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
$env:RECONSTRUCTION_MODE = "disabled"
uvicorn app.main:app --reload --port 8000
```

For a local Meshroom or COLMAP runner, set `RECONSTRUCTION_MODE=local` and configure
`LOCAL_ENGINE_COMMAND`. The command is trusted local configuration and can use
`${input_dir}`, `${output_dir}`, and `${job_id}` placeholders. It must write a
`.glb` or `.gltf` file into `${output_dir}`.

Example wrapper command:

```text
python C:\tools\reconstruct.py --input ${input_dir} --output ${output_dir}
```

For a GPU worker, set `RECONSTRUCTION_MODE=external` and `EXTERNAL_WORKER_URL`.
The worker must accept `POST /v1/reconstructions` as multipart `images` and return
`{"model_url":"https://.../model.glb"}`.

Endpoints:

- `GET /health`
- `GET /v1/capabilities`
- `POST /v1/reconstructions` with multipart `images` and optional `antique_id`
- `GET /v1/reconstructions/{job_id}`

The service accepts JPEG, PNG, and WEBP images. Six images are recommended for a future photogrammetry worker.

## Production

Render should run this API in `disabled` or `external` mode. Do not run Meshroom/COLMAP inside a normal Render web service. Use a GPU worker and object storage for production artifacts.
