from pathlib import Path

import cv2
import numpy as np


def extract_foreground_views(input_dir: Path) -> tuple[Path, Path]:
    foreground_dir = input_dir / "foreground"
    masks_dir = input_dir / "masks"
    foreground_dir.mkdir(parents=True, exist_ok=True)
    masks_dir.mkdir(parents=True, exist_ok=True)

    for image_path in sorted(input_dir.glob("*")):
        if image_path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
            continue
        image = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
        if image is None or min(image.shape[:2]) < 32:
            raise ValueError(f"Could not decode reconstruction image {image_path.name}.")

        height, width = image.shape[:2]
        margin_x, margin_y = max(1, width // 40), max(1, height // 40)
        rectangle = (margin_x, margin_y, width - 2 * margin_x, height - 2 * margin_y)
        labels = np.zeros((height, width), dtype=np.uint8)
        background = np.zeros((1, 65), dtype=np.float64)
        foreground = np.zeros((1, 65), dtype=np.float64)
        cv2.grabCut(image, labels, rectangle, background, foreground, 5, cv2.GC_INIT_WITH_RECT)
        mask = np.where(
            (labels == cv2.GC_FGD) | (labels == cv2.GC_PR_FGD), 255, 0
        ).astype(np.uint8)
        coverage = cv2.countNonZero(mask) / (width * height)
        if coverage < 0.01 or coverage > 0.98:
            raise ValueError(f"Could not isolate an object in {image_path.name}.")

        rgba = cv2.cvtColor(image, cv2.COLOR_BGR2BGRA)
        rgba[:, :, 3] = mask
        name = f"{image_path.stem}.png"
        cv2.imwrite(str(foreground_dir / name), rgba)
        cv2.imwrite(str(masks_dir / f"{image_path.stem}_mask.png"), mask)

    return foreground_dir, masks_dir
