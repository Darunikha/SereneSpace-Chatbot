import logging
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import ChatMessageRequest, ChatMessageResponse
from app.services.safety_service import get_safety_service
from app.rag.retriever import get_retriever
from app.services.llm_service import get_llm_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("", response_model=ChatMessageResponse)
async def chat_endpoint(request: ChatMessageRequest):
    """
    Core RAG Chat endpoint. Handles crisis detection, vector context retrieval,
    and grounded query processing via OpenRouter.
    """
    user_message = request.message.strip()
    if not user_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty or whitespace only."
        )

    try:
        # Step 1: Safety & Crisis Detection
        safety_svc = get_safety_service()
        crisis_result = safety_svc.check_message(user_message)
        
        if crisis_result and crisis_result.get("is_crisis"):
            logger.info("Crisis detected. Returning helpline details immediately.")
            return ChatMessageResponse(
                response=crisis_result["response"],
                sources=crisis_result["sources"]
            )

        # Step 2: Context Retrieval from Vector Database
        retriever = get_retriever()
        context_chunks, sources = retriever.retrieve(user_message)

        # Step 3: Grounded Answer Generation
        llm_svc = get_llm_service()
        llm_response = llm_svc.generate_response(
            query=user_message,
            context_chunks=context_chunks,
            history=request.history
        )

        return ChatMessageResponse(
            response=llm_response,
            sources=sources
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error processing chat request: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong while processing your message. Please try again."
        )
