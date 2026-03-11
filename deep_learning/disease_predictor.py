from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Tuple

import numpy as np
import torch
from PIL import Image
from torchvision import transforms
from torchvision.models import efficientnet_b0

from .class_labels import CLASS_LABELS


_MODEL: torch.nn.Module | None = None
_DEVICE = torch.device("cpu")


def _get_model_path() -> Path:
    """Return the path to the pretrained plant disease model."""
    base_dir = Path(__file__).resolve().parent.parent
    return base_dir / "DeepLearningModels" / "plant_disease_model.pth"


def load_model() -> torch.nn.Module:
    """
    Load EfficientNet-B0 model with pretrained weights for plant disease detection.

    The model is loaded once and kept in memory for subsequent inferences.
    """
    global _MODEL

    if _MODEL is not None:
        return _MODEL

    model_path = _get_model_path()
    if not model_path.exists():
        raise FileNotFoundError(
            f"Plant disease model file not found at {model_path}. "
            "Please place 'plant_disease_model.pth' in the 'DeepLearningModels' folder."
        )

    # Initialize EfficientNet-B0 architecture with the correct number of classes (38),
    # matching the classifier head used during training.
    model = efficientnet_b0(weights=None, num_classes=len(CLASS_LABELS))

    # Load state dict on CPU
    state_dict = torch.load(model_path, map_location=_DEVICE)
    model.load_state_dict(state_dict)

    model.eval()
    model.to(_DEVICE)

    _MODEL = model
    return _MODEL


def preprocess_image(image: Image.Image) -> torch.Tensor:
    """
    Preprocess a PIL image for EfficientNet-B0 inference.

    Steps:
    - Convert to RGB
    - Resize to 224x224
    - Convert to tensor
    - Normalize using ImageNet statistics
    """
    # IMPORTANT: match training transforms from the notebook
    # (Resize -> ToTensor, NO normalization).
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
    ])

    if image.mode != "RGB":
        image = image.convert("RGB")

    tensor = transform(image).unsqueeze(0)  # Add batch dimension
    return tensor.to(_DEVICE)


def _estimate_leafiness(image: Image.Image) -> float:
    """
    Heuristic check to estimate how 'leaf-like' an image is.

    We downsample the image and compute the proportion of pixels where
    the green channel dominates (G significantly higher than R and B).
    This is NOT perfect but helps catch obviously non-leaf images (e.g. screens, people, documents).
    """
    if image.mode != "RGB":
        image = image.convert("RGB")

    small = image.resize((128, 128))
    arr = np.asarray(small).astype("float32") / 255.0

    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]

    green_dominant = (g > r * 1.1) & (g > b * 1.1) & (g > 0.2)
    leaf_score = float(green_dominant.mean())
    return leaf_score


def _load_treatment_mapping() -> Dict[str, Any]:
    """Load treatment advice from JSON mapping."""
    import json

    base_dir = Path(__file__).resolve().parent
    advice_path = base_dir / "treatment_advice.json"
    if not advice_path.exists():
        return {}

    with advice_path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _get_treatment_advice(disease_label: str) -> Tuple[list[str], list[str]]:
    """Return treatment advice list and raw label parts for display."""
    mapping = _load_treatment_mapping()
    advice = mapping.get(disease_label) or mapping.get("default") or []

    # Convert raw dataset label into a more readable plant + disease string
    # Example: "Tomato___Early_blight" -> ("Tomato", "Early blight")
    if "___" in disease_label:
        plant, disease = disease_label.split("___", maxsplit=1)
    else:
        plant, disease = "", disease_label

    pretty_disease = disease.replace("_", " ").replace("  ", " ").strip()
    pretty_plant = plant.replace("_", " ").replace("(maize)", "maize").strip()

    return advice, [pretty_plant, pretty_disease]


def predict_disease(image: Image.Image) -> Dict[str, Any]:
    """
    Run disease prediction on a PIL image.

    Returns (keys):
        {
            "label": "<raw_dataset_label>",
            "display_name": "<pretty human-readable name>",
            "confidence": 0.0-1.0 float,
            "confidence_percent": 0.0-100.0 float,
            "treatment": [list of recommendations],
            "is_confident": bool,  # whether confidence >= threshold
            "confidence_threshold": float  # threshold in percent
        }
    """
    confidence_threshold = 55.0

    # First, run a quick heuristic to see if the image even looks like a leaf
    leaf_score = _estimate_leafiness(image)
    leafiness_threshold = 0.15  # at least 15% green-dominant pixels

    if leaf_score < leafiness_threshold:
        # Do not run the model; this is very likely not a leaf image
        return {
            "label": "NoLeaf",
            "display_name": "No leaf detected",
            "confidence": 0.0,
            "confidence_percent": 0.0,
            "treatment": [],
            "is_confident": False,
            "confidence_threshold": confidence_threshold,
            "is_leaf": False,
            "leaf_score": leaf_score,
        }

    # Otherwise, run the disease model
    model = load_model()
    input_tensor = preprocess_image(image)

    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = torch.softmax(outputs, dim=1).cpu().numpy()[0]

    predicted_index = int(np.argmax(probabilities))
    confidence = float(probabilities[predicted_index])

    if predicted_index < 0 or predicted_index >= len(CLASS_LABELS):
        label = "Unknown"
    else:
        label = CLASS_LABELS[predicted_index]

    treatment_advice, name_parts = _get_treatment_advice(label)
    plant_name, disease_name = name_parts if len(name_parts) == 2 else ("", label)

    if plant_name and disease_name:
        display_name = f"{plant_name} - {disease_name}"
    else:
        display_name = disease_name or plant_name or label

    confidence_percent = round(confidence * 100.0, 2)

    return {
        "label": label,
        "display_name": display_name,
        "confidence": confidence,
        "confidence_percent": confidence_percent,
        "treatment": treatment_advice,
        "is_confident": confidence_percent >= confidence_threshold,
        "confidence_threshold": confidence_threshold,
        "is_leaf": True,
        "leaf_score": leaf_score,
    }

