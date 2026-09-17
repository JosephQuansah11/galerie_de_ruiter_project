# Project Plan

**Status**: Approved
**Created**: 2026-09-16
**Mode**: AUGMENT

---

## 1. Project Overview

**Goal**: Add a separate Python FastAPI image-to-3D reconstruction service under this repository that accepts multi-image uploads, runs provider-neutral reconstruction jobs (local CLI, external worker, disabled), and returns durable job state including `model_url` while preserving the current Java integration contract.

**App Type**: API only

**API Login**: No

**Mode**: AUGMENT

**Deployment Plan**: No deployment plan found

---

## 2. Reconstruction API - backend

| Component | Technology |
|-----------|-----------|
| **Language** | Python |
| **Runtime** | CPython |
| **Package Manager** | pip |
| **Test Runner** | pytest |
| **Mocking Library** | unittest.mock |
| **Test Command** | pytest |
| **Orchestration** | docker-compose |

---

## 3. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| Blob Storage | Optional cloud artifact store for uploaded images and generated model files (`model_url` target) | STORAGE_CONNECTION_STRING | UseDevelopmentStorage=true | Enhancement |
| Queue Storage | Optional async queue backend for external-worker execution mode | STORAGE_CONNECTION_STRING | UseDevelopmentStorage=true | Enhancement |

---

## 4. Prerequisites

### Run

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Python | reconstruction-api | ❓ | Unknown |
| pip | reconstruction-api | ❓ | Unknown |
| pytest | reconstruction-api | ❓ | Unknown |

### Debug

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Docker | reconstruction-api | ✅ | 29.5.2 |
| Docker Compose | reconstruction-api | ✅ | v5.1.4 |

Double-check every ❓ tool is installed and available on PATH before scaffolding.

---

## 5. Project Structure

```text
project/
├── .azure/
│   ├── requirements.json
│   └── project-plan.md
└── services/
    └── reconstruction-api/
        ├── app/
        │   ├── __init__.py
        │   ├── main.py
        │   ├── api/
        │   │   ├── __init__.py
        │   │   └── routes/
        │   │       ├── __init__.py
        │   │       ├── health.py
        │   │       ├── capabilities.py
        │   │       └── reconstructions.py
        │   ├── core/
        │   │   ├── __init__.py
        │   │   ├── config.py
        │   │   ├── cors.py
        │   │   └── logging.py
        │   ├── domain/
        │   │   ├── __init__.py
        │   │   ├── models.py
        │   │   └── validators.py
        │   ├── engines/
        │   │   ├── __init__.py
        │   │   ├── base.py
        │   │   ├── local_cli.py
        │   │   ├── external_worker.py
        │   │   └── disabled.py
        │   ├── services/
        │   │   ├── __init__.py
        │   │   ├── reconstruction_service.py
        │   │   ├── job_store.py
        │   │   └── artifact_store.py
        │   └── workers/
        │       ├── __init__.py
        │       └── local_runner.py
        ├── data/
        │   ├── jobs/
        │   │   └── {job_id}.json
        │   └── artifacts/
        │       └── {job_id}/
        │           ├── input/
        │           └── output/
        │               └── model.glb
        ├── tests/
        │   ├── test_health.py
        │   ├── test_capabilities.py
        │   ├── test_reconstructions_create.py
        │   ├── test_reconstructions_status.py
        │   └── test_image_validation.py
        ├── .dockerignore
        ├── .env.example
        ├── Dockerfile
        ├── requirements.txt
        ├── requirements-dev.txt
        ├── pytest.ini
        ├── README.md
        └── RENDER.md
```

---

## 6. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Status Codes |
|---|--------|------|-------------|-------------|--------------|-------------|
| 1 | GET | `/health` | Liveness/health probe for Render and local checks | - | `{ "status": "ok", "engine_mode": "local|external_worker|disabled" }` | 200, 503 |
| 2 | GET | `/v1/capabilities` | Returns active engine mode and supported constraints | - | `{ "engine_mode", "accepts_multipart": true, "supported_input": { "min_images": 1, "recommended_images": 6, "max_images": 12 }, "output": { "format": "glb", "model_url": "string|null" } }` | 200 |
| 3 | POST | `/v1/reconstructions` | Creates a reconstruction job from multipart image uploads with optional antique linkage | `multipart/form-data` with `images[]` and optional `antique_id` | `{ "job_id", "status": "queued|running|completed|failed", "progress": 0, "error": null, "model_url": null, "created_at" }` | 201, 400, 413, 415, 422, 500 |
| 4 | GET | `/v1/reconstructions/{job_id}` | Gets job status/progress/errors and model URL when complete | - | `{ "job_id", "antique_id": "string|null", "status", "progress": 0-100, "error": "string|null", "model_url": "string|null", "updated_at" }` | 200, 404, 500 |

The response shape preserves the existing Java `modelUrl` contract by keeping the JSON field as `model_url` in this service and mapping via the Java client layer without requiring Java-service changes in this phase.

---

## 7. Next Steps

1. Run **azure-project-scaffold** to execute this plan
2. Run **azure-project-integrate** to wire integration points and smoke-test the backend
3. Run **azure-debug-plan** -> **azure-debug-generate** for Docker-based local debugging
4. Run the **azure-deploy** agent when ready for Azure IaC/provisioning workflows
