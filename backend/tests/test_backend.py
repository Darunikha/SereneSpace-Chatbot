import os
import sys
import pytest
from unittest.mock import MagicMock, patch

# Ensure backend directory is in path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app
from app.services.safety_service import SafetyService
from app.rag.vector_store import VectorStore
from app.rag.ingestion import chunk_text

client = TestClient(app)

# -------------------------------------------------------------
# 1. API Health Check Endpoints
# -------------------------------------------------------------
def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "healthy"
    assert "vector_store_loaded" in json_data

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert "Mental Wellness Chatbot API is operational" in response.json()["message"]

# -------------------------------------------------------------
# 2. Input Validation (Empty and Long Messages)
# -------------------------------------------------------------
def test_chat_empty_message():
    # Empty string check (length < 1)
    response = client.post("/api/chat", json={"message": ""})
    assert response.status_code == 422  # Pydantic validation error

def test_chat_whitespace_only():
    # Whitespace only should trigger bad request
    response = client.post("/api/chat", json={"message": "   "})
    assert response.status_code == 400
    assert "Message content cannot be empty" in response.json()["detail"]

def test_chat_excessive_length():
    # Long message (> 2000 characters)
    long_msg = "a" * 2001
    response = client.post("/api/chat", json={"message": long_msg})
    assert response.status_code == 422

# -------------------------------------------------------------
# 3. Crisis Detection Layer
# -------------------------------------------------------------
def test_crisis_keywords_trigger():
    safety_svc = SafetyService()
    
    # Test suicidal keywords
    result1 = safety_svc.check_message("I feel like killing myself today")
    assert result1 is not None
    assert result1["is_crisis"] is True
    assert "Suicide & Crisis Lifeline" in result1["response"]

    # Test self-harm keywords
    result2 = safety_svc.check_message("I am cutting myself in my room")
    assert result2 is not None
    assert result2["is_crisis"] is True

    # Test clean messages
    result3 = safety_svc.check_message("I had a stressful day at work")
    assert result3 is None

def test_chat_endpoint_crisis_handling():
    # Posting a crisis query directly should bypass LLM and return help hotlines
    response = client.post("/api/chat", json={"message": "I want to commit suicide"})
    assert response.status_code == 200
    json_data = response.json()
    assert "Suicide & Crisis Lifeline" in json_data["response"]
    assert len(json_data["sources"]) > 0
    assert json_data["sources"][0]["title"] == "Crisis and Support Helpline Resources"

# -------------------------------------------------------------
# 4. Text Chunking & Ingestion Helpers
# -------------------------------------------------------------
def test_text_chunking():
    text = "This is a sentence. And another one. " * 30
    chunks = chunk_text(text, chunk_size_words=10, chunk_overlap_words=2)
    assert len(chunks) > 1
    # Check that chunks overlap correctly
    assert len(chunks[0].split()) <= 25  # Should handle sentence boundaries properly

# -------------------------------------------------------------
# 5. Vector Store Operations
# -------------------------------------------------------------
def test_vector_store_search():
    store = VectorStore()
    chunks = [
        {"text": "Apples are red fruit.", "metadata": {"title": "Apples", "url": "url1"}},
        {"text": "Stress relief using breathing.", "metadata": {"title": "Stress", "url": "url2"}},
    ]
    # Simple embeddings (2 dimensions)
    embeddings = [
        [1.0, 0.0],
        [0.0, 1.0]
    ]
    store.add_documents(chunks, embeddings)
    
    # Search for something close to the second chunk
    results = store.search([0.1, 0.9], top_k=1)
    assert len(results) == 1
    assert results[0][0]["metadata"]["title"] == "Stress"
    assert results[0][1] > 0.8  # High cosine similarity

# -------------------------------------------------------------
# 6. LLM Grounded Prompt and Fallback Mock
# -------------------------------------------------------------
@patch("app.services.llm_service.requests.post")
def test_llm_service_openrouter_mock(mock_post):
    # Setup mock response from OpenRouter
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [
            {
                "message": {
                    "content": "According to the WHO guidelines, a daily routine is key to managing stress."
                }
            }
        ]
    }
    mock_post.return_value = mock_response

    from app.services.llm_service import get_llm_service
    llm_svc = get_llm_service()
    
    # Temporarily set a dummy key to enable OpenRouter pathway
    llm_svc.api_key = "dummy_key"
    
    response_text = llm_svc.generate_response(
        query="What is a good way to manage stress?",
        context_chunks=["Keep a daily routine. Having a schedule can make us feel more in control."],
        history=[]
    )
    
    assert "daily routine" in response_text


@patch("app.services.llm_service.requests.post")
def test_llm_service_mode_prompts(mock_post):
    from app.services.llm_service import get_llm_service
    llm_svc = get_llm_service()
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [
            {
                "message": {
                    "content": "Reflective response"
                }
            }
        ]
    }
    mock_post.return_value = mock_response
    llm_svc.api_key = "dummy_key"
    
    # Test listen mode
    llm_svc.generate_response(
        query="I feel sad",
        context_chunks=["Some coping info"],
        history=[],
        mode="listen"
    )
    
    call_args = mock_post.call_args
    payload = call_args[1]["json"]
    system_prompt = payload["messages"][0]["content"]
    assert "LISTEN MODE" in system_prompt
    assert "DO NOT offer advice" in system_prompt
    assert "ADVICE MODE" not in system_prompt

    # Test advice mode
    llm_svc.generate_response(
        query="I feel sad",
        context_chunks=["Some coping info"],
        history=[],
        mode="advice"
    )
    
    call_args = mock_post.call_args
    payload = call_args[1]["json"]
    system_prompt = payload["messages"][0]["content"]
    assert "ADVICE MODE" in system_prompt
    assert "LISTEN MODE" not in system_prompt

