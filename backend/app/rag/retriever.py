import logging
from typing import List, Dict, Any, Tuple
from app.rag.embeddings import get_embedding_generator
from app.rag.vector_store import get_vector_store
from app.config import settings
from app.models.schemas import SourceCitation

logger = logging.getLogger(__name__)

class Retriever:
    def __init__(self):
        self.embed_gen = get_embedding_generator()
        self.store = get_vector_store()
        self.top_k = settings.top_k

    def retrieve(self, query: str) -> Tuple[List[str], List[SourceCitation]]:
        """
        Retrieves the top K relevant text chunks and their unique source citations.
        """
        if not query.strip():
            return [], []

        try:
            logger.info(f"Generating embedding for query: '{query}'")
            query_embedding = self.embed_gen.get_embedding(query)
            
            logger.info(f"Searching vector store (TOP_K = {self.top_k})...")
            search_results = self.store.search(query_embedding, top_k=self.top_k)
            
            chunks: List[str] = []
            sources: List[SourceCitation] = []
            seen_sources = set()

            for chunk_data, score in search_results:
                text = chunk_data.get("text", "")
                metadata = chunk_data.get("metadata", {})
                
                chunks.append(text)
                
                # Deduplicate sources based on title and URL
                title = metadata.get("title", "Untitled")
                url = metadata.get("url", "")
                source_key = (title, url)

                if source_key not in seen_sources:
                    seen_sources.add(source_key)
                    sources.append(SourceCitation(
                        title=title,
                        organization=metadata.get("organization", "Unknown"),
                        url=url,
                        topic=metadata.get("topic", "General")
                    ))
            
            logger.info(f"Retrieved {len(chunks)} chunks and compiled {len(sources)} unique sources.")
            return chunks, sources

        except Exception as e:
            logger.error(f"Error during retrieval: {e}")
            # Fail gracefully, returning empty context
            return [], []

# Singleton instance
_retriever_instance = None

def get_retriever() -> Retriever:
    global _retriever_instance
    if _retriever_instance is None:
        _retriever_instance = Retriever()
    return _retriever_instance
