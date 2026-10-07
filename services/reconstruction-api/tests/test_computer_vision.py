import cv2
import numpy as np

from app.computer_vision import extract_foreground_views


def test_extracts_foreground_and_binary_mask(tmp_path):
    input_dir = tmp_path / "views"
    input_dir.mkdir()
    image = np.full((160, 160, 3), 245, dtype=np.uint8)
    image[45:120, 55:105] = (20, 40, 210)
    assert cv2.imwrite(str(input_dir / "front.png"), image)

    foreground_dir, masks_dir = extract_foreground_views(input_dir)
    mask = cv2.imread(str(masks_dir / "front_mask.png"), cv2.IMREAD_GRAYSCALE)
    segmented = cv2.imread(str(foreground_dir / "front.png"), cv2.IMREAD_UNCHANGED)

    assert mask is not None and segmented is not None
    assert mask[80, 80] == 255
    assert mask[5, 5] == 0
    assert segmented.shape[2] == 4
    assert segmented[5, 5, 3] == 0
