"""
FAUNA-X: Integration Tests for Vision Model Inference
Tests actual trained model weights without mocking.
"""
import pytest
from pathlib import Path
from ai.vision.model_loader import vision_manager
from ai.vision.inference import run_vision_inference
from ai.vision.preprocessing import check_image_quality
from PIL import Image
import io

def test_vision_model_singleton_loads():
    """Verify that the real trained model loads into memory properly."""
    success = vision_manager.initialize()
    assert success is True, "Failed to load model weights"
    assert vision_manager.is_ready is True
    assert vision_manager.model is not None
    
    meta = vision_manager.metadata
    assert meta["task"] == "classification"
    assert "lumpy_skin" in meta["classes"]
    assert "fmd" in meta["classes"]
    assert "healthy" in meta["classes"]

def test_vision_inference_on_real_image():
    """Runs inference on a known test sample and validates clinical response schema."""
    # Find a test image in external_test
    base_dir = Path(__file__).resolve().parent.parent
    sample_images = list((base_dir / "data" / "external_test").rglob("*.jpg"))
    assert len(sample_images) > 0, "No test images found in data/external_test"

    sample_path = sample_images[0]
    with open(sample_path, "rb") as f:
        img_bytes = f.read()

    result = run_vision_inference(image_bytes=img_bytes, animal_species="cattle")
    
    # Assert structured schema requirements
    assert "model" in result
    assert result["model"]["version"] == "1.0.0"
    assert "prediction" in result
    pred = result["prediction"]
    assert pred["class"] in ["fmd", "healthy", "lumpy_skin"]
    assert 0.0 <= pred["confidence"] <= 1.0
    assert 0.0 <= pred["percentage"] <= 100.0
    assert isinstance(pred["is_low_confidence"], bool)
    assert result["requires_veterinary_verification"] is True
    assert "disclaimer" in result["clinical_disclaimer"].lower() or "screening" in result["clinical_disclaimer"].lower()
    assert "alternatives" in result
    assert "image_quality" in result

def test_image_quality_check():
    """Tests blur and brightness detection logic."""
    img = Image.new("RGB", (224, 224), color=(128, 128, 128))
    quality = check_image_quality(img)
    assert "overall_quality_score" in quality
    assert quality["width"] == 224
    assert quality["height"] == 224
