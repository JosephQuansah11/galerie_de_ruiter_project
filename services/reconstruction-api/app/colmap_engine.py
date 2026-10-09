import argparse
import subprocess
from pathlib import Path

import open3d as o3d
import numpy as np
import trimesh


def run_colmap(command: list[str], stage: str, progress: int) -> None:
    print(f"PROGRESS:{progress} {stage}", flush=True)
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode:
        details = (result.stderr or result.stdout).strip()
        raise RuntimeError(details[-4000:] or f"COLMAP {stage} exited with code {result.returncode}.")


def reconstruct(input_dir: Path, output_dir: Path) -> Path:
    images = sorted(
        path for path in input_dir.iterdir()
        if path.is_file() and path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    )
    if len(images) != 6:
        raise ValueError(f"Expected six reconstruction images, received {len(images)}.")

    output_dir.mkdir(parents=True, exist_ok=True)
    workspace = output_dir / "colmap"
    sparse_dir = workspace / "sparse"
    database = workspace / "database.db"
    sparse_dir.mkdir(parents=True, exist_ok=True)

    run_colmap(
        [
            "colmap", "feature_extractor",
            "--database_path", str(database),
            "--image_path", str(input_dir),
            "--ImageReader.single_camera", "1",
            "--ImageReader.camera_model", "SIMPLE_RADIAL",
            "--SiftExtraction.use_gpu", "0",
        ],
        "feature extraction",
        25,
    )
    run_colmap(
        [
            "colmap", "exhaustive_matcher",
            "--database_path", str(database),
            "--SiftMatching.use_gpu", "0",
        ],
        "image matching",
        40,
    )
    run_colmap(
        [
            "colmap", "mapper",
            "--database_path", str(database),
            "--image_path", str(input_dir),
            "--output_path", str(sparse_dir),
        ],
        "camera alignment",
        55,
    )

    reconstructions = sorted(
        (path for path in sparse_dir.iterdir() if path.is_dir()),
        key=lambda path: int(path.name) if path.name.isdigit() else -1,
    )
    if not reconstructions:
        raise RuntimeError(
            "COLMAP could not align the submitted views. Use sharp photos with "
            "overlapping details, consistent lighting, and no camera movement."
        )

    sparse_cloud = workspace / "sparse.ply"
    run_colmap(
        [
            "colmap", "model_converter",
            "--input_path", str(reconstructions[0]),
            "--output_path", str(sparse_cloud),
            "--output_type", "PLY",
        ],
        "point-cloud export",
        70,
    )
    print("PROGRESS:80 mesh generation", flush=True)
    cloud = o3d.io.read_point_cloud(str(sparse_cloud))
    if len(cloud.points) < 20:
        raise RuntimeError(
            "COLMAP found too few matching 3D points. Submit clearer views with "
            "more overlapping visual detail."
        )
    cloud = cloud.voxel_down_sample(max(np.linalg.norm(cloud.get_max_bound() - cloud.get_min_bound()) / 500, 1e-5))
    cloud.estimate_normals(
        search_param=o3d.geometry.KDTreeSearchParamHybrid(
            radius=max(np.linalg.norm(cloud.get_max_bound() - cloud.get_min_bound()) / 20, 1e-4),
            max_nn=30,
        )
    )
    cloud.orient_normals_consistent_tangent_plane(min(10, len(cloud.points) - 1))
    mesh, densities = o3d.geometry.TriangleMesh.create_from_point_cloud_poisson(cloud, depth=8)
    density_values = np.asarray(densities)
    if len(density_values):
        mesh.remove_vertices_by_mask(density_values < np.quantile(density_values, 0.03))
    mesh.remove_degenerate_triangles()
    mesh.remove_duplicated_triangles()
    mesh.remove_duplicated_vertices()
    mesh.remove_unreferenced_vertices()
    if len(mesh.triangles) < 4:
        raise RuntimeError("The reconstructed point cloud did not produce a usable surface mesh.")

    if len(mesh.triangles) > 200_000:
        mesh = mesh.simplify_quadric_decimation(200_000)
    model_path = output_dir / "reconstruction.glb"
    colors = np.asarray(mesh.vertex_colors)
    visual = trimesh.visual.ColorVisuals(vertex_colors=colors) if len(colors) else None
    artifact = trimesh.Trimesh(
        vertices=np.asarray(mesh.vertices),
        faces=np.asarray(mesh.triangles),
        visual=visual,
        process=True,
    )
    artifact.export(model_path, file_type="glb")
    if not model_path.is_file() or model_path.stat().st_size == 0:
        raise RuntimeError("COLMAP did not produce a readable GLB model.")
    print("PROGRESS:95 GLB export", flush=True)
    return model_path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    model = reconstruct(args.input, args.output)
    print(f"Created {model}", flush=True)


if __name__ == "__main__":
    main()
