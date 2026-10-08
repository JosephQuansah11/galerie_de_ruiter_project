# Render

Add this service as a separate Render web service:

- Root: `services/reconstruction-api`
- Runtime: Docker
- Dockerfile: `services/reconstruction-api/Dockerfile`
- Health path: `/health`
- `RECONSTRUCTION_MODE=local` to use the bundled CPU COLMAP engine; six-view runs can be slow and require persistent disk for job inputs and GLB outputs
- `RECONSTRUCTION_MODE=external` and `EXTERNAL_WORKER_URL` to delegate to a separately managed GPU worker
- `CORS_ORIGINS=https://galerie-frontend.onrender.com`

The service health endpoint reports `processing_available`; `GET /v1/capabilities`
also reports the selected engine. Do not leave a production service in `disabled`
mode if users are expected to create models. The local mode performs CPU feature
matching and mesh generation; provision adequate memory, CPU time, and a persistent
disk mounted at `DATA_DIR`. For production workloads, the external GPU worker is
recommended and must return a publicly reachable model URL.
