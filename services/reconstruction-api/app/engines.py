import asyncio
import json
import os
from pathlib import Path
from string import Template
from urllib.request import Request, urlopen

from .config import settings
from .models import JobStatus, ReconstructionJob
from .store import JobStore


class ReconstructionEngine:
    async def run(
        self, job: ReconstructionJob, input_dir: Path, store: JobStore
    ) -> ReconstructionJob:
        raise NotImplementedError


class DisabledEngine(ReconstructionEngine):
    async def run(self, job, input_dir, store):
        job.status = JobStatus.disabled
        job.error = (
            "Reconstruction is disabled. Configure a local engine or external GPU worker."
        )
        return store.save(job)


class ExternalEngine(ReconstructionEngine):
    async def run(self, job, input_dir, store):
        if not settings.external_worker_url:
            job.status = JobStatus.failed
            job.error = "EXTERNAL_WORKER_URL is not configured."
            return store.save(job)

        job.status = JobStatus.running
        job.progress = 10
        store.save(job)
        try:
            payload = await asyncio.to_thread(
                _submit_external_job, settings.external_worker_url, job, input_dir
            )
            model_url = payload.get("model_url")
            if not model_url:
                raise RuntimeError("The external worker did not return model_url.")
            job.model_url = model_url
            job.status = JobStatus.completed
            job.progress = 100
            job.error = None
        except Exception as error:
            job.status = JobStatus.failed
            job.error = str(error)
        return store.save(job)


class LocalEngine(ReconstructionEngine):
    async def run(self, job, input_dir, store):
        if not settings.local_engine_command:
            job.status = JobStatus.failed
            job.error = (
                "LOCAL_ENGINE_COMMAND is not configured. "
                "Configure a Meshroom or COLMAP reconstruction command."
            )
            return store.save(job)

        output_dir = store.output_dir(job.job_id)
        command = Template(settings.local_engine_command).safe_substitute(
            input_dir=str(input_dir.resolve()),
            output_dir=str(output_dir.resolve()),
            job_id=job.job_id,
        )
        job.status = JobStatus.running
        job.progress = 10
        store.save(job)
        try:
            process = await asyncio.create_subprocess_shell(
                command,
                cwd=str(input_dir.parent.parent),
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=os.environ.copy(),
            )
            _, stderr = await process.communicate()
            if process.returncode != 0:
                detail = stderr.decode(errors="replace").strip()
                raise RuntimeError(
                    detail
                    or f"Local reconstruction exited with code {process.returncode}."
                )
            model = next(output_dir.glob("*.glb"), None) or next(
                output_dir.glob("*.gltf"), None
            )
            if not model:
                raise RuntimeError(
                    "Local reconstruction completed without a .glb or .gltf artifact."
                )
            job.model_url = f"/v1/reconstructions/{job.job_id}/model/{model.name}"
            job.status = JobStatus.completed
            job.progress = 100
            job.error = None
        except Exception as error:
            job.status = JobStatus.failed
            job.error = str(error)
        return store.save(job)


def _submit_external_job(worker_url: str, job, input_dir: Path) -> dict:
    boundary = "----galerie-reconstruction"
    chunks = []
    for file in sorted(input_dir.iterdir()):
        chunks.extend(
            [
                (
                    f'--{boundary}\r\nContent-Disposition: form-data; '
                    f'name="images"; filename="{file.name}"\r\n'
                    "Content-Type: application/octet-stream\r\n\r\n"
                ).encode(),
                file.read_bytes(),
                b"\r\n",
            ]
        )
    chunks.append(f"--{boundary}--\r\n".encode())
    request = Request(
        worker_url.rstrip("/") + "/v1/reconstructions",
        data=b"".join(chunks),
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "X-Reconstruction-Job-Id": job.job_id,
        },
        method="POST",
    )
    with urlopen(request, timeout=settings.external_worker_timeout_seconds) as response:
        return json.loads(response.read().decode())


def engine_for_mode() -> ReconstructionEngine:
    return {
        "disabled": DisabledEngine(),
        "local": LocalEngine(),
        "external": ExternalEngine(),
    }[settings.reconstruction_mode]
