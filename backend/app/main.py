import os
import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.rag.vector_store import get_vector_store
from app.rag.ingestion import ingest_documents
from app.routes import chat, health, ingest

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("app.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to index seed documents upon backend startup."""
    store = get_vector_store()
    
    # Try to load vector store from disk
    vector_store_dir = os.path.abspath(settings.vector_db_path)
    logger.info(f"Checking for existing vector store index in: {vector_store_dir}")
    
    loaded = store.load(vector_store_dir)
    
    if not loaded:
        logger.info("Vector database index not found. Initiating seeding routine...")
        
        # Resolve path to data/documents/seed_data.json
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        seed_path = os.path.join(base_dir, "data", "documents", "seed_data.json")
        
        if os.path.exists(seed_path):
            try:
                with open(seed_path, "r", encoding="utf-8") as f:
                    seed_docs = json.load(f)
                
                logger.info(f"Loaded {len(seed_docs)} documents from seed file. Starting ingestion...")
                ingest_documents(seed_docs, vector_store_dir)
                logger.info("Database seeding completed successfully.")
            except Exception as e:
                logger.error(f"Seeding failed during initialization: {e}", exc_info=True)
        else:
            logger.error(f"Seeding aborted: seed_data.json not found at {seed_path}")
    else:
        logger.info(f"Existing vector index loaded. Total segments: {len(store.chunks)}")
        
    yield
    logger.info("Tearing down backend server resources.")

app = FastAPI(
    title="Mental Wellness RAG Chatbot API",
    description="A secure and grounded FastAPI backend for the Mental Wellness RAG Chatbot.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Policy configuration for Vite development server
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach routes
app.include_router(chat.router, prefix="/api")
app.include_router(health.router, prefix="/api")
app.include_router(ingest.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Mental Wellness Chatbot API is operational. Visit /docs for documentation."}
