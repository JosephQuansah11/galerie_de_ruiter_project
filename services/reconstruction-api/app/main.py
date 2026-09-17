import uuid
from datetime import datetime, timezone
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .engines import engine_for_mode
from .models import Capabilities, JobStatus, ReconstructionJob
from .store import JobStore

app = FastAPI(title='Galerie Reconstruction API', version='0.1.0')
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
store = JobStore(settings.data_dir)
engine = engine_for_mode()

@app.get('/health')
def health():
    return {'status': 'ok', 'engine_mode': settings.reconstruction_mode}

@app.get('/v1/capabilities', response_model=Capabilities)
def capabilities():
    return Capabilities(engine_mode=settings.reconstruction_mode, output={'format': 'glb', 'model_url': settings.model_base_url or None})

async def process_job(job: ReconstructionJob, input_dir):
    updated = await engine.run(job, input_dir, store)
    store.save(updated)

@app.post('/v1/reconstructions', response_model=ReconstructionJob, status_code=201)
async def create_reconstruction(
    background_tasks: BackgroundTasks,
    images: list[UploadFile] = File(...),
    antique_id: str | None = Form(default=None),
    positions: list[str] = Form(default=[]),
):
    allowed_positions = {'front', 'back', 'left', 'right', 'top', 'bottom'}
    if len(images) != 6 or len(positions) != 6 or set(positions) != allowed_positions:
        raise HTTPException(400, 'Exactly six images and the positions front, back, left, right, top, bottom are required')
    job = ReconstructionJob(job_id=str(uuid.uuid4()), antique_id=antique_id, status=JobStatus.queued, progress=0)
    input_dir = store.input_dir(job.job_id)
    for index, image in enumerate(images):
        if image.content_type not in {'image/jpeg', 'image/png', 'image/webp'}:
            raise HTTPException(415, 'Only JPEG, PNG, and WEBP images are supported')
        data = await image.read()
        if not data or len(data) > settings.max_image_bytes:
            raise HTTPException(413, f'Each image must be smaller than {settings.max_image_bytes} bytes')
        suffix = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp'}[image.content_type]
        (input_dir / f'{positions[index]}{suffix}').write_bytes(data)
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
