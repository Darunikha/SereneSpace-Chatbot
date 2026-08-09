import logging
import requests
from typing import List, Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.api_key = settings.openrouter_api_key
        self.model = settings.openrouter_model
        self.endpoint = "https://openrouter.ai/api/v1/chat/completions"

    def is_api_key_configured(self) -> bool:
        return bool(self.api_key) and self.api_key != "your_openrouter_api_key_here"

    def generate_response(
        self,
        query: str,
        context_chunks: List[str],
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Formulates the RAG prompt, appends context and history,
        and requests a grounded response from the OpenRouter LLM.
        """
        # Formulate retrieved context
        context_text = "\n\n---\n\n".join(context_chunks) if context_chunks else "No relevant verified source text retrieved."

        # Safety & Grounding System Prompt
        system_prompt = (
            "You are a mental wellness information assistant. Provide supportive, practical, "
            "evidence-based information. Use the retrieved verified sources below as the primary "
            "basis for factual claims. If the retrieved context does not contain enough information "
            "to answer a factual question, clearly state: 'The available verified sources do not "
            "provide enough information to answer this.' Do not invent or extrapolate medical details.\n\n"
            "CRITICAL SAFETY LIMITATIONS:\n"
            "- You are NOT a licensed therapist, psychiatrist, doctor, or medical professional.\n"
            "- You must NEVER diagnose the user with any mental health condition.\n"
            "- You must NEVER prescribe or recommend medication changes (dosage, starting, or stopping).\n"
            "- Keep a calm, supportive, non-judgmental, clear, and respectful tone. Do not be overly "
            "cheerful, do not use excessive emojis, and do not claim to feel emotions or act as a therapist.\n\n"
            "VERIFIED RETRIEVED CONTEXT:\n"
            f"{context_text}"
        )

        # Assemble message sequence
        messages = [{"role": "system", "content": system_prompt}]

        # Add history if present (limiting history to last 6 messages to keep context window tight)
        if history:
            # History expected as list of {"role": "user" | "assistant", "content": "..."}
            recent_history = history[-6:]
            for msg in recent_history:
                messages.append({
                    "role": msg.get("role"),
                    "content": msg.get("content")
                })

        # Append current user query
        messages.append({"role": "user", "content": query})

        # Check if API key is set. If not, return a informative fallback message.
        if not self.is_api_key_configured():
            logger.warning("OpenRouter API key is not configured. Returning fallback explanation.")
            return (
                "I am ready to help, but the OpenRouter API key has not been configured in the backend environment. "
                "For now, here is the verified information I retrieved from my database:\n\n"
                f"{self._format_chunks_for_fallback(context_chunks)}\n\n"
                "*(Please add your OpenRouter API key to the `.env` file in the backend to enable natural LLM responses.)*"
            )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "Mental Wellness RAG Chatbot"
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 1000
        }

        try:
            logger.info(f"Sending request to OpenRouter model: {self.model}")
            response = requests.post(self.endpoint, json=payload, headers=headers, timeout=30)
            
            if response.status_code == 401:
                logger.error("OpenRouter unauthorized error. Please verify the API key.")
                return (
                    "I encountered an authorization issue connecting to my intelligence engine. "
                    "The configured API key appears to be invalid. Here is the verified local information:\n\n"
                    f"{self._format_chunks_for_fallback(context_chunks)}"
                )
            
            response.raise_for_status()
            res_data = response.json()
            
            choices = res_data.get("choices", [])
            if choices:
                answer = choices[0].get("message", {}).get("content", "").strip()
                if answer:
                    return answer
            
            logger.error(f"Empty choice selection from OpenRouter response: {res_data}")
            raise ValueError("No valid choice in OpenRouter response.")

        except requests.exceptions.RequestException as e:
            logger.error(f"HTTP error communicating with OpenRouter: {e}")
            return (
                "I'm sorry, I'm having trouble connecting to my response engine right now. "
                "However, I retrieved this verified guidance for you:\n\n"
                f"{self._format_chunks_for_fallback(context_chunks)}"
            )
        except Exception as e:
            logger.error(f"Unexpected error in LLM service: {e}")
            return (
                "An unexpected error occurred while processing your response. "
                "Here is the verified information retrieved from my local records:\n\n"
                f"{self._format_chunks_for_fallback(context_chunks)}"
            )

    def _format_chunks_for_fallback(self, chunks: List[str]) -> str:
        """Utility to format chunks into readable bullet points when LLM fails or is unconfigured."""
        if not chunks:
            return "No verified local information is available for this query."
        
        formatted = []
        for i, chunk in enumerate(chunks, 1):
            # Show a snippet or full chunk text
            formatted.append(f"**Guidance Recommendation {i}:**\n{chunk}")
        return "\n\n".join(formatted)

# Singleton instance
_llm_service_instance = None

def get_llm_service() -> LLMService:
    global _llm_service_instance
    if _llm_service_instance is None:
        _llm_service_instance = LLMService()
    return _llm_service_instance
