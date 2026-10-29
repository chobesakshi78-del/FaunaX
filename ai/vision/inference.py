"""
FAUNA-X AI: Vision Inference Pipeline
Coordinates preprocessing, model forward pass on GPU/CPU, and postprocessing.
"""
from typing import Dict, Any, Optional
from PIL import Image
import torch

from ai.vision.model_loader import vision_manager
from ai.vision.preprocessing import preprocess_image_bytes
from ai.vision.postprocessing import postprocess_classification_output

def run_vision_inference(
    image_bytes: bytes,
    animal_species: str = "cattle"
) -> Dict[str, Any]:
    """Executes full FAUNA-X vision screening on raw image bytes."""
    # 1. Preprocess & validate image
    rgb_image, quality_audit = preprocess_image_bytes(image_bytes, target_size=224)

    # 2. Ensure model is loaded
    if not vision_manager.is_ready:
        success = vision_manager.initialize()
        if not success:
            raise RuntimeError("FAUNA-X AI Vision model is unavailable or failed initialization.")

    model = vision_manager.model
    device = vision_manager.device

    # 3. Model Forward Pass
    with torch.no_grad():
        results = model.predict(
            source=rgb_image,
            imgsz=224,
            verbose=False,
            device=device
        )

    res = results[0]
    
    # 4. Extract Class Probabilities
    # res.probs.data is torch.Tensor of probabilities
    probs_tensor = res.probs.data.cpu().numpy()
    class_names = res.names
    
    class_probabilities = {
        class_names[i]: float(probs_tensor[i])
        for i in range(len(class_names))
    }

    # 5. Postprocess into Standardized Screening Schema
    structured_result = postprocess_classification_output(
        class_probabilities=class_probabilities,
        quality_audit=quality_audit,
        animal_species=animal_species
    )

    return structured_result
