"""
FAUNA-X AI: Image Preprocessing and Quality Verification
Validates image files, detects blur and lighting defects, and prepares input tensors.
"""
import io
from typing import Tuple, Dict, Any
from PIL import Image, ImageStat
import numpy as np
import cv2

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/bmp"}
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB
MIN_IMAGE_DIM = 64
BLUR_THRESHOLD = 50.0  # Laplacian variance threshold

def check_image_quality(image: Image.Image) -> Dict[str, Any]:
    """Inspects resolution, brightness, and sharpness of livestock photographs."""
    width, height = image.size
    
    # 1. Brightness check via grayscale mean
    gray = image.convert("L")
    stat = ImageStat.Stat(gray)
    mean_brightness = stat.mean[0]  # 0 (pure black) to 255 (pure white)

    is_too_dark = mean_brightness < 30.0
    is_too_bright = mean_brightness > 235.0

    # 2. Blur / Sharpness check via OpenCV Laplacian variance
    open_cv_image = np.array(gray)
    laplacian_var = float(cv2.Laplacian(open_cv_image, cv2.CV_64F).var())
    is_blurry = laplacian_var < BLUR_THRESHOLD

    # Determine overall quality status
    quality_score = 1.0
    issues = []
    
    if width < 128 or height < 128:
        quality_score -= 0.3
        issues.append("Low resolution image (<128px)")
    if is_blurry:
        quality_score -= 0.25
        issues.append(f"Image blur detected (sharpness: {laplacian_var:.1f})")
    if is_too_dark:
        quality_score -= 0.25
        issues.append(f"Underexposed / very dark lighting (mean: {mean_brightness:.1f})")
    if is_too_bright:
        quality_score -= 0.25
        issues.append(f"Overexposed / direct glare (mean: {mean_brightness:.1f})")

    quality_score = max(0.0, min(1.0, quality_score))

    return {
        "width": width,
        "height": height,
        "sharpness_score": round(laplacian_var, 2),
        "brightness_mean": round(mean_brightness, 2),
        "is_blurry": is_blurry,
        "is_too_dark": is_too_dark,
        "is_too_bright": is_too_bright,
        "overall_quality_score": round(quality_score, 2),
        "quality_level": "GOOD" if quality_score >= 0.75 else ("FAIR" if quality_score >= 0.5 else "POOR"),
        "issues": issues
    }

def preprocess_image_bytes(image_bytes: bytes, target_size: int = 224) -> Tuple[Image.Image, Dict[str, Any]]:
    """Validates raw image bytes and returns cleaned PIL Image and quality audit."""
    if len(image_bytes) > MAX_FILE_SIZE_BYTES:
        raise ValueError(f"File size exceeds maximum allowable limit of {MAX_FILE_SIZE_BYTES / (1024*1024):.0f} MB")

    try:
        pil_img = Image.open(io.BytesIO(image_bytes))
        pil_img.verify()
        
        # Reopen after verify()
        pil_img = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        raise ValueError(f"Corrupt or unreadable image file: {str(e)}")

    # Check minimum dimensions
    w, h = pil_img.size
    if w < MIN_IMAGE_DIM or h < MIN_IMAGE_DIM:
        raise ValueError(f"Image resolution too low ({w}x{h}). Minimum required is {MIN_IMAGE_DIM}x{MIN_IMAGE_DIM}.")

    # Convert to standard RGB
    rgb_img = pil_img.convert("RGB")
    
    # Assess quality
    quality_audit = check_image_quality(rgb_img)

    return rgb_img, quality_audit
