import asyncio
import sys
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import open3d as o3d
import trimesh

from app import colmap_engine
from app.engines import LocalEngine
from app.models import JobStatus, ReconstructionJob
from app.store import JobStore


def test_local_engine_runs_command_reports_progress_and_publishes_glb(tmp_path, monkeypatch):
    store = JobStore(tmp_path)
    job = ReconstructionJob(job_id="local-engine-test", status=JobStatus.queued, progress=0)
    input_dir = store.input_dir(job.job_id)
    monkeypatch.setattr(
        "app.engines.extract_foreground_views",
        lambda _: (input_dir, input_dir),
    )
    script = tmp_path / "fake_local_engine.py"
    script.write_text(
        "from pathlib import Path\n"
        "import sys\n"
        "output = Path(sys.argv[1])\n"
        "output.mkdir(parents=True, exist_ok=True)\n"
        "(output / 'model.glb').write_bytes(b'glTF')\n"
        "print('PROGRESS:45 feature matching', flush=True)\n",
        encoding="utf-8",
    )
    monkeypatch.setattr(
        "app.engines.settings.local_engine_command",
        f'"{sys.executable}" "{script}" ${{output_dir}}',
    )

    result = asyncio.run(LocalEngine().run(job, input_dir, store))

    assert result.status == JobStatus.completed
    assert result.progress == 100
    assert result.model_url == f"/v1/reconstructions/{job.job_id}/model/model.glb"
    assert store.output_dir(job.job_id).joinpath("model.glb").read_bytes() == b"glTF"


def test_store_marks_jobs_interrupted_by_restart_as_failed(tmp_path):
    store = JobStore(tmp_path)
    job = ReconstructionJob(job_id="interrupted-job", status=JobStatus.running, progress=45)
    store.save(job)

    store.recover_interrupted_jobs()

    recovered = store.get(job.job_id)
    assert recovered.status == JobStatus.failed
    assert recovered.progress == 45
    assert "restarted" in recovered.error


def test_colmap_pipeline_exports_a_loadable_glb(tmp_path, monkeypatch):
    input_dir = tmp_path / "images"
    input_dir.mkdir()
    for position in ("front", "back", "left", "right", "top", "bottom"):
        (input_dir / f"{position}.jpg").write_bytes(b"test")
    count = 512
    indices = np.arange(count, dtype=np.float64) + 0.5
    z = 1 - 2 * indices / count
    radius = np.sqrt(1 - z * z)
    theta = np.pi * (1 + np.sqrt(5)) * indices
    points = np.column_stack((radius * np.cos(theta), radius * np.sin(theta), z))
    point_cloud = o3d.geometry.PointCloud(o3d.utility.Vector3dVector(points))
    point_cloud.colors = o3d.utility.Vector3dVector(np.tile([0.65, 0.4, 0.25], (count, 1)))

    def run_fake_colmap(command, **_):
        if command[1] == "mapper":
            output_dir = Path(command[command.index("--output_path") + 1]) / "0"
            output_dir.mkdir(parents=True)
        elif command[1] == "model_converter":
            cloud_path = command[command.index("--output_path") + 1]
            assert o3d.io.write_point_cloud(cloud_path, point_cloud)
        return SimpleNamespace(returncode=0, stderr="", stdout="")

    monkeypatch.setattr(colmap_engine.subprocess, "run", run_fake_colmap)
    output = colmap_engine.reconstruct(input_dir, tmp_path / "output")

    assert output.read_bytes()[:4] == b"glTF"
    scene = trimesh.load(output, force="scene")
    assert scene.geometry
