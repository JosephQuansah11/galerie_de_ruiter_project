from datetime import datetime, timezone
from enum import StrEnum
from pydantic import BaseModel, Field

class JobStatus(StrEnum):
    queued = 'queued'
    running = 'running'
    completed = 'completed'
    failed = 'failed'
    disabled = 'processing_disabled'

class ReconstructionJob(BaseModel):
    job_id: str
    antique_id: str | None = None
    status: JobStatus
    progress: int = Field(ge=0, le=100)
    error: str | None = None
    model_url: str | None = None
    image_urls: list[str] = Field(default_factory=list)
    image_views: list[dict[str, str]] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Capabilities(BaseModel):
    engine_mode: str
    processing_available: bool = False
    accepts_multipart: bool = True
    supported_input: dict[str, int] = {'min_images': 6, 'recommended_images': 6, 'max_images': 6}
    output: dict[str, str | None] = {'format': 'glb', 'model_url': None}
