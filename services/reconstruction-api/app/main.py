import uuid
import shutil
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .engines import engine_for_mode
from .models import Capabilities, JobStatus, ReconstructionJob
from .store import JobStore

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(_app):
    store.recover_interrupted_jobs()
    yield


app = FastAPI(title='Galerie Reconstruction API', version='0.1.0', lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
store = JobStore(settings.data_dir)
engine = engine_for_mode()

def processing_available() -> bool:
    if settings.reconstruction_mode == "local":
        if not settings.local_engine_command:
            return False
        if "app.colmap_engine" in settings.local_engine_command:
            return shutil.which("colmap") is not None
        return True
    if settings.reconstruction_mode == "external":
        return bool(settings.external_worker_url)
    return False


def unavailable_reason() -> str:
    if settings.reconstruction_mode == "external" and not settings.external_worker_url:
        return "EXTERNAL_WORKER_URL is not configured."
    if settings.reconstruction_mode == "local" and not settings.local_engine_command:
        return "LOCAL_ENGINE_COMMAND is not configured."
    if (
        settings.reconstruction_mode == "local"
        and "app.colmap_engine" in settings.local_engine_command
        and shutil.which("colmap") is None
    ):
        return "COLMAP is not installed in the reconstruction service."
    return "Reconstruction processing is disabled."


@app.get('/health')
def health():
    return {
        'status': 'ok',
        'engine_mode': settings.reconstruction_mode,
        'processing_available': processing_available(),
    }

@app.get('/v1/capabilities', response_model=Capabilities)
def capabilities():
    return Capabilities(
        engine_mode=settings.reconstruction_mode,
        processing_available=processing_available(),
        output={'format': 'glb', 'model_url': settings.model_base_url or None},
    )

async def process_job(job: ReconstructionJob, input_dir):
    try:
        updated = await engine.run(job, input_dir, store)
    except Exception as error:
        logger.exception("Reconstruction job %s failed unexpectedly.", job.job_id)
        job.status = JobStatus.failed
        job.error = str(error)[:4000]
        updated = job
    store.save(updated)

@app.post('/v1/reconstructions', response_model=ReconstructionJob, status_code=201)
async def create_reconstruction(
    background_tasks: BackgroundTasks,
    images: list[UploadFile] = File(...),
    antique_id: str | None = Form(default=None),
    positions: list[str] = Form(default=[]),
):
    if not processing_available():
        raise HTTPException(503, unavailable_reason())
    allowed_positions = {'front', 'back', 'left', 'right', 'top', 'bottom'}
    if len(images) != 6 or len(positions) != 6 or len(set(positions)) != 6 or set(positions) != allowed_positions:
        raise HTTPException(400, 'Exactly six images and the positions front, back, left, right, top, bottom are required')
    job = ReconstructionJob(job_id=str(uuid.uuid4()), antique_id=antique_id, status=JobStatus.queued, progress=0)
    input_dir = store.input_dir(job.job_id)
    for image, position in sorted(zip(images, positions), key=lambda entry: entry[1]):
        if image.content_type not in {'image/jpeg', 'image/png', 'image/webp'}:
            raise HTTPException(415, 'Only JPEG, PNG, and WEBP images are supported')
        data = await image.read()
        if not data or len(data) > settings.max_image_bytes:
            raise HTTPException(413, f'Each image must be smaller than {settings.max_image_bytes} bytes')
        suffix = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp'}[image.content_type]
        (input_dir / f'{position}{suffix}').write_bytes(data)
    store.save(job)
    background_tasks.add_task(process_job, job, input_dir)
    return job

@app.get('/v1/reconstructions/{job_id}', response_model=ReconstructionJob)
def reconstruction_status(job_id: str):
    job = store.get(job_id)
    if not job:
        raise HTTPException(404, 'Reconstruction job not found')
    return job

@app.get('/v1/reconstructions/{job_id}/images/{filename}')
def reconstruction_image(job_id: str, filename: str):
    path = store.input_dir(job_id) / filename
    if not path.exists() or path.parent != store.input_dir(job_id):
        raise HTTPException(404, 'Image not found')
    return FileResponse(path)

@app.get('/v1/reconstructions/{job_id}/model/{filename}')
def reconstruction_model(job_id: str, filename: str):
    path = store.output_dir(job_id) / filename
    if not path.exists() or path.parent != store.output_dir(job_id):
        raise HTTPException(404, 'Model not found')
    media_type = 'model/gltf-binary' if path.suffix == '.glb' else 'model/gltf+json'
    return FileResponse(path, media_type=media_type)
