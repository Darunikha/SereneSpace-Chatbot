import logging
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.schemas import IngestRequest
from app.rag.ingestion import ingest_documents
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ingest", tags=["Ingest"])

@router.post("", status_code=status.HTTP_201_CREATED)
async def ingest_endpoint(payload: List[IngestRequest]):
    """
    Ingests a list of new verified mental wellness resources.
    Splits, embeds, and indexes them in the local vector store.
    """
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request body cannot be an empty list."
        )

    try:
        documents = []
        for doc in payload:
            documents.append({
                "title": doc.title,
                "content": doc.content,
                "source": doc.source,
                "url": str(doc.url),
                "organization": doc.organization,
                "topic": doc.topic,
                "date": doc.date or ""
            })

        logger.info(f"Triggered ingestion for {len(documents)} manual documents.")
        ingest_documents(documents, settings.vector_db_path)
        
        return {"message": f"Successfully ingested {len(documents)} documents."}
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to ingest documents into vector database."
        )
