import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from .models import JobStatus, ReconstructionJob

logger = logging.getLogger(__name__)

class JobStore:
    def __init__(self, root: Path):
        self.root = root
        self.jobs = root / 'jobs'
        self.artifacts = root / 'artifacts'
        self.jobs.mkdir(parents=True, exist_ok=True)
        self.artifacts.mkdir(parents=True, exist_ok=True)

    def save(self, job: ReconstructionJob) -> ReconstructionJob:
        job.updated_at = datetime.now(timezone.utc)
        (self.jobs / f'{job.job_id}.json').write_text(job.model_dump_json(indent=2), encoding='utf-8')
        return job

    def recover_interrupted_jobs(self) -> None:
        for path in self.jobs.glob("*.json"):
            try:
                job = ReconstructionJob.model_validate_json(path.read_text(encoding="utf-8"))
            except (OSError, ValueError):
                logger.exception("Could not read reconstruction job state from %s.", path)
                continue
            if job.status in {JobStatus.queued, JobStatus.running}:
                job.status = JobStatus.failed
                job.error = "The reconstruction service restarted before this job completed. Submit the six views again."
                self.save(job)

    def get(self, job_id: str) -> ReconstructionJob | None:
        path = self.jobs / f'{job_id}.json'
        if not path.exists():
            return None
        return ReconstructionJob.model_validate_json(path.read_text(encoding='utf-8'))

    def input_dir(self, job_id: str) -> Path:
        path = self.artifacts / job_id / 'input'
        path.mkdir(parents=True, exist_ok=True)
        return path

    def output_dir(self, job_id: str) -> Path:
        path = self.artifacts / job_id / 'output'
        path.mkdir(parents=True, exist_ok=True)
        return path
