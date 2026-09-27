# Render

Add this service as a separate Render web service:

- Root: `services/reconstruction-api`
- Runtime: Docker
- Dockerfile: `services/reconstruction-api/Dockerfile`
- Health path: `/health`
- `RECONSTRUCTION_MODE=disabled` until a GPU worker and object storage are available
- `CORS_ORIGINS=https://galerie-frontend.onrender.com`

Render web services have no reliable GPU-backed photogrammetry environment. Keep reconstruction execution behind the engine interface and connect an external GPU worker later.
