import os
import json
import logging
from typing import List, Dict, Any
from app.rag.embeddings import get_embedding_generator
from app.rag.vector_store import get_vector_store
from app.config import settings

logger = logging.getLogger(__name__)

def chunk_text(text: str, chunk_size_words: int = 250, chunk_overlap_words: int = 50) -> List[str]:
    """
    Split text into chunks of a specific word length with overlap.
    Maintains sentence boundaries when possible.
    """
    words = text.split()
    if len(words) <= chunk_size_words:
        return [text]

    chunks = []
    start = 0
    total_words = len(words)

    while start < total_words:
        end = min(start + chunk_size_words, total_words)
        
        # Adjust end to finish at a sentence boundary if possible to keep context intact
        adjusted_end = end
        if end < total_words:
            # Look ahead a few words for sentence terminators (., !, ?)
            look_ahead = min(end + 15, total_words)
            for idx in range(end, look_ahead):
                if words[idx].endswith(('.', '!', '?')):
                    adjusted_end = idx + 1
                    break
        
        chunk_words = words[start:adjusted_end]
        chunks.append(" ".join(chunk_words))
        
        # Advance the start pointer
        start += (chunk_size_words - chunk_overlap_words)
        # Prevent infinite loops in case configuration is broken
        if chunk_size_words <= chunk_overlap_words:
            start = adjusted_end

    return chunks

def ingest_documents(documents: List[Dict[str, Any]], vector_store_dir: str):
    """
    Takes a list of documents, chunks them, generates embeddings,
    and updates the global vector store.
    """
    if not documents:
        logger.warning("No documents provided for ingestion.")
        return

    embed_gen = get_embedding_generator()
    store = get_vector_store()

    all_chunks = []
    chunk_texts = []

    for doc in documents:
        content = doc.get("content", "")
        if not content.strip():
            continue

        # Extract metadata
        metadata = {
            "title": doc.get("title", "Untitled"),
            "source": doc.get("source", "Unknown"),
            "url": doc.get("url", ""),
            "organization": doc.get("organization", "Unknown"),
            "topic": doc.get("topic", "General"),
            "date": doc.get("date", "")
        }

        # Divide document content into chunks
        chunks = chunk_text(content)
        logger.info(f"Split document '{metadata['title']}' into {len(chunks)} chunks.")

        for i, chunk in enumerate(chunks):
            chunk_meta = metadata.copy()
            chunk_meta["chunk_id"] = f"{metadata['title']}_chunk_{i}"
            
            all_chunks.append({
                "text": chunk,
                "metadata": chunk_meta
            })
            chunk_texts.append(chunk)

    if not all_chunks:
        logger.warning("No valid text chunks were created during ingestion.")
        return

    logger.info(f"Generating embeddings for {len(chunk_texts)} chunks...")
    embeddings = embed_gen.get_embeddings(chunk_texts)

    logger.info("Adding chunks to Vector Store...")
    store.add_documents(all_chunks, embeddings)

    # Save to disk
    logger.info(f"Saving vector store to {vector_store_dir}...")
    store.save(vector_store_dir)
