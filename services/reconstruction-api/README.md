# Reconstruction API

Standalone FastAPI service for image-to-3D reconstruction jobs.

## Modes

- `local` (default): runs the bundled CPU COLMAP pipeline, converts the sparse point cloud into a GLB mesh, and serves the artifact.
- `disabled`: rejects new jobs with HTTP 503 and reports processing as unavailable.
- `external`: submits the six images to a separately managed GPU worker and stores the returned model URL.

The API intentionally does not embed a paid reconstruction provider or credentials.

## Run locally

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
$env:RECONSTRUCTION_MODE = "local"
uvicorn app.main:app --reload --port 8000
```

Native execution also requires the COLMAP command-line tools installed on `PATH`.
For a preconfigured local engine, build and start the Docker service from the
repository root with `docker compose -f docker-compose.dev.yml up -d --build reconstruction-api`.
The Docker image includes COLMAP and Open3D. Its CPU photogrammetry workflow
converts a sparse reconstruction into an untextured, low-detail GLB mesh in the
job output directory. Six clear, sharp images with overlapping visual features are
required; smooth or reflective objects may not provide enough feature matches.
The local mode needs substantial CPU and memory, and the data volume must persist
between restarts so submitted images and generated models remain available.

To run a custom local runner, set `RECONSTRUCTION_MODE=local` and override
`LOCAL_ENGINE_COMMAND`. The command can use `${input_dir}`, `${raw_input_dir}`,
`${mask_dir}`, `${output_dir}`, and `${job_id}` placeholders, and must write a
`.glb` or `.gltf` artifact into `${output_dir}`.

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

The service accepts JPEG, PNG, and WEBP images. Six images from distinct angles
are required for the current photogrammetry workflow.

## Production

For production, provision enough CPU, memory, and persistent storage for local
reconstruction, or set `RECONSTRUCTION_MODE=external` and configure
`EXTERNAL_WORKER_URL` for a GPU worker. Keep `disabled` only when model generation
is intentionally unavailable. The browser viewer loads the completed GLB from the
reconstruction API, while the Java API stores its URL and six source views with the
antique.
