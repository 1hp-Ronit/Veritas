"""
Veritas — Embedding Service
Provides text embedding (sentence-transformers) and image embedding (CLIP).
Models are loaded once at module level to avoid re-initialization per request.
"""

import os
import numpy as np
from dotenv import load_dotenv
from PIL import Image
from sentence_transformers import SentenceTransformer
from transformers import CLIPModel, CLIPProcessor

load_dotenv()

# ---------------------------------------------------------------------------
# Load sentence-transformers model (text embeddings)
# ---------------------------------------------------------------------------
_text_model = SentenceTransformer("all-MiniLM-L6-v2")

# ---------------------------------------------------------------------------
# Load CLIP model and processor (image + text multimodal embeddings)
# ---------------------------------------------------------------------------
_clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
_clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")


def embed_text(text: str) -> list[float]:
    """
    Encode a text string into a dense vector using sentence-transformers.
    Returns a list of floats (384-dimensional for all-MiniLM-L6-v2).
    """
    embedding = _text_model.encode(text, convert_to_numpy=True)
    return embedding.tolist()


def embed_image(image_path: str) -> list[float]:
    """
    Encode an image into a dense vector using CLIP.
    Loads the image from disk with Pillow, runs it through the CLIP vision encoder.
    Returns a list of floats (512-dimensional for clip-vit-base-patch32).
    """
    image = Image.open(image_path).convert("RGB")
    inputs = _clip_processor(images=image, return_tensors="pt")
    outputs = _clip_model.get_image_features(**inputs)
    # Normalize and convert to list
    embedding = outputs.detach().numpy().flatten()
    embedding = embedding / np.linalg.norm(embedding)
    return embedding.tolist()


def embed_combined(text: str, image_path: str | None = None) -> list[float]:
    """
    Produce a combined embedding from text and an optional image.
    - If image_path is provided and exists, averages the text vector and image
      vector (after zero-padding the shorter one to match dimensions).
    - If no image, returns the text embedding as-is.
    """
    text_vec = np.array(embed_text(text))

    if image_path and os.path.isfile(image_path):
        image_vec = np.array(embed_image(image_path))

        # Align dimensions by zero-padding the shorter vector
        max_dim = max(len(text_vec), len(image_vec))
        if len(text_vec) < max_dim:
            text_vec = np.pad(text_vec, (0, max_dim - len(text_vec)))
        if len(image_vec) < max_dim:
            image_vec = np.pad(image_vec, (0, max_dim - len(image_vec)))

        combined = (text_vec + image_vec) / 2.0
        combined = combined / np.linalg.norm(combined)
        return combined.tolist()

    return text_vec.tolist()
