import os
import json
import logging
import numpy as np
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self):
        self.chunks: List[Dict[str, Any]] = []
        self.embeddings: List[List[float]] = []

    def add_documents(self, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
        """Add document chunks and their corresponding embeddings to the store."""
        if len(chunks) != len(embeddings):
            raise ValueError("The number of chunks and embeddings must match.")
        
        self.chunks.extend(chunks)
        self.embeddings.extend(embeddings)
        logger.info(f"Added {len(chunks)} chunks to vector store. Total chunks: {len(self.chunks)}")

    def search(self, query_embedding: List[float], top_k: int = 4) -> List[Tuple[Dict[str, Any], float]]:
        """
        Search for the top K closest chunks using cosine similarity.
        Returns a list of tuples containing (chunk_dict, score).
        """
        if not self.chunks:
            logger.warning("Searching an empty vector store.")
            return []

        # Convert to numpy arrays for fast vector operations
        q_vec = np.array(query_embedding)
        store_vecs = np.array(self.embeddings)

        # Normalize vectors for cosine similarity
        q_norm = np.linalg.norm(q_vec)
        if q_norm == 0:
            return []
        
        # Avoid division by zero by adding a small epsilon
        store_norms = np.linalg.norm(store_vecs, axis=1)
        store_norms = np.where(store_norms == 0, 1e-9, store_norms)

        # Cosine similarity: dot(A, B) / (||A|| * ||B||)
        similarities = np.dot(store_vecs, q_vec) / (store_norms * q_norm)

        # Get top K indices with highest similarity
        top_k = min(top_k, len(self.chunks))
        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            results.append((self.chunks[idx], float(similarities[idx])))

        return results

    def save(self, directory_path: str):
        """Save vector store to a JSON file in the specified directory."""
        os.makedirs(directory_path, exist_ok=True)
        file_path = os.path.join(directory_path, "store.json")
        
        data = {
            "chunks": self.chunks,
            "embeddings": self.embeddings
        }
        
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info(f"Vector store saved successfully to {file_path}")
        except Exception as e:
            logger.error(f"Failed to save vector store: {e}")
            raise e

    def load(self, directory_path: str) -> bool:
        """Load vector store from a JSON file in the specified directory. Returns True if successful."""
        file_path = os.path.join(directory_path, "store.json")
        if not os.path.exists(file_path):
            logger.warning(f"Vector store file not found at {file_path}")
            return False

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.chunks = data.get("chunks", [])
            self.embeddings = data.get("embeddings", [])
            logger.info(f"Vector store loaded successfully from {file_path}. Total chunks: {len(self.chunks)}")
            return True
        except Exception as e:
            logger.error(f"Failed to load vector store: {e}")
            return False

# Singleton VectorStore instance
_store_instance = None

def get_vector_store() -> VectorStore:
    global _store_instance
    if _store_instance is None:
        _store_instance = VectorStore()
    return _store_instance
