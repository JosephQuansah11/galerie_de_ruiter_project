import asyncio
from pathlib import Path
from .config import settings
from .models import JobStatus, ReconstructionJob
from .store import JobStore
class ReconstructionEngine:
    async def run(self, job: ReconstructionJob, input_dir: Path, store: JobStore) -> ReconstructionJob:
        raise NotImplementedError

class DisabledEngine(ReconstructionEngine):
    async def run(self, job, input_dir, store):
        job.status = JobStatus.disabled
        job.error = 'Reconstruction is disabled in this environment. Configure an external GPU worker or local engine.'
        job.updated_at = __import__('datetime').datetime.now(__import__('datetime').timezone.utc)
        return store.save(job)

class ExternalEngine(ReconstructionEngine):
    async def run(self, job, input_dir, store):
        job.status = JobStatus.failed
        job.error = 'External reconstruction worker is not configured yet.'
        return store.save(job)

class LocalEngine(ReconstructionEngine):
    async def run(self, job, input_dir, store):
        
        positions = [
    'front',
    'back',
    'left',
    'right',
    'top',
    'bottom',
]
        
        job.image_views = []
        job.status = JobStatus.completed
        job.progress = 100
        job.error = 'CPU six-view fallback active; configure Meshroom/COLMAP for true geometry.'
        # job.image_urls = [f'/v1/reconstructions/{job.job_id}/images/{file.name}' for file in files]
        for position in positions:
            matches = list(input_dir.glob(f'{position}.*'))

            if not matches:
                continue

            file = matches[0]

            job.image_views.append({
                'position': position,
                'url': f'/v1/reconstructions/{job.job_id}/images/{file.name}',
            })

        job.image_urls = [
            view['url']
            for view in job.image_views
        ]
        job.updated_at = __import__('datetime').datetime.now(__import__('datetime').timezone.utc)
        return store.save(job)

def engine_for_mode() -> ReconstructionEngine:
    return {'disabled': DisabledEngine(), 'local': LocalEngine(), 'external': ExternalEngine()}[settings.reconstruction_mode]
