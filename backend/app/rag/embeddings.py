import logging
from typing import List
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

class EmbeddingGenerator:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        logger.info(f"Initializing embedding model: {model_name}")
        try:
            self.model = SentenceTransformer(model_name)
            logger.info("Embedding model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise e

    def get_embedding(self, text: str) -> List[float]:
        """Generate a vector embedding for a single text string."""
        if not text.strip():
            raise ValueError("Cannot embed empty text.")
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate vector embeddings for a list of text strings."""
        if not texts:
            return []
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()

# Singleton instance initialized lazily
_generator_instance = None

def get_embedding_generator() -> EmbeddingGenerator:
    global _generator_instance
    if _generator_instance is None:
        _generator_instance = EmbeddingGenerator()
    return _generator_instance
