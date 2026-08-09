from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.rag.vector_store import get_vector_store

router = APIRouter(prefix="/health", tags=["System"])

@router.get("", response_model=HealthResponse)
async def health_endpoint():
    """Returns the API status and checks if the RAG Vector Store contains seed documents."""
    store = get_vector_store()
    loaded = len(store.chunks) > 0
    return HealthResponse(
        status="healthy",
        vector_store_loaded=loaded
    )
