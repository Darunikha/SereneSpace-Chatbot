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
        history: Optional[List[Dict[str, str]]] = None,
        mode: str = "advice",
        mood: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Formulates the RAG prompt, appends context and history,
        and requests a grounded response from the OpenRouter LLM.
        """
        # Formulate retrieved context
        context_text = "\n\n---\n\n".join(context_chunks) if context_chunks else "No relevant verified source text retrieved."

        # Parse mood if available
        mood_context = ""
        if mood:
            label = mood.get("label", "Unknown")
            emoji = mood.get("emoji", "")
            tags = mood.get("tags", [])
            note = mood.get("note", "")
            date_str = mood.get("date", "")
            
            # Formulate mood information string
            mood_info = f"Latest logged mood: {emoji} {label}"
            if tags:
                mood_info += f" | Activities/Factors: {', '.join(tags)}"
            if note:
                mood_info += f" | Context note: '{note}'"
            
            # Check date context if possible
            date_context = ""
            if date_str:
                try:
                    from datetime import datetime, timezone
                    # date_str is usually ISO format: e.g., '2026-08-18T10:08:21.000Z'
                    clean_date_str = date_str.replace("Z", "+00:00")
                    logged_time = datetime.fromisoformat(clean_date_str)
                    now = datetime.now(timezone.utc)
                    diff = now - logged_time
                    diff_seconds = diff.total_seconds()
                    
                    if diff_seconds < 0:
                        date_context = " (logged just now)"
                    elif diff_seconds < 3600:
                        mins = int(diff_seconds // 60)
                        date_context = f" (logged {mins} minute{'s' if mins != 1 else ''} ago)"
                    elif diff_seconds < 86400:
                        hours = int(diff_seconds // 3600)
                        date_context = f" (logged {hours} hour{'s' if hours != 1 else ''} ago)"
                    else:
                        days = int(diff_seconds // 86400)
                        date_context = f" (logged {days} day{'s' if days != 1 else ''} ago)"
                except Exception as e:
                    logger.warning(f"Error parsing mood date: {e}")
            
            mood_info += date_context
            
            mood_context = (
                "USER'S MOOD AND CONTEXT:\n"
                f"{mood_info}\n\n"
                "INSTRUCTIONS FOR MOOD-AWARE RESPONSE:\n"
                "1. If this mood was logged recently (e.g., within 24 hours), adapt your tone directly to their current state. "
                "For example, if they are Sad/Stressed, be extra gentle, validating, and calming. If Happy/Calm, match that warmth. "
                "Acknowledge the mood/context naturally if it relates to their message.\n"
                "2. If this mood was logged longer ago (more than 24 hours ago), treat it as historical/past context. "
                "Do not assume they still feel that way right now, but you can reference it if helpful (e.g. 'I noticed you logged feeling stressed a few days ago, how are things going now?').\n"
                "3. Keep the validation natural. Do NOT list the mood score or details clinically unless they ask. Be empathetic, human, and conversational."
            )

        # System prompt instructions tailored to the selected mode (listen vs advice)
        if mode == "listen":
            how_to_respond = (
                "HOW TO RESPOND (LISTEN MODE):\n"
                "1. FEEL FIRST — Acknowledge and validate the user's feelings warmly and genuinely. Use empathetic, human phrasing.\n"
                "2. REFLECT & VALIDATE — Focus entirely on active, reflective listening. Help the user explore and process their feelings by mirroring what they've shared. "
                "DO NOT offer advice, coping strategies, exercises, tools, or solutions unless they explicitly ask you for them. "
                "Your primary goal is to be a supportive sounding board, allowing them to vent and feel heard. Be present, rather than trying to fix things.\n"
                "3. ALWAYS FOLLOW UP — End every single response with one warm, open-ended question that invites the user to go deeper or explore their feelings. Keep it natural and tailored to their story."
            )
            nuances = (
                "IMPORTANT NUANCES (LISTEN MODE):\n"
                "- If someone seems to be in genuine distress or mentions thoughts of self-harm, gently acknowledge their pain "
                "and encourage them to reach out to a crisis line or professional — do not brush past it.\n"
                "- Refrain from giving any unsolicited recommendations, steps, or guides. Simply sit with them and listen.\n"
                "- If they explicitly ask for specific techniques or advice (e.g. 'How do I cope?' or 'Give me an exercise'), you can provide them from the reference material, but otherwise default strictly to active listening.\n"
                "- Never diagnose. Never suggest or comment on medication. Never pretend to be human.\n"
                "- Keep responses focused and reasonably concise. Two or three thoughtful paragraphs is usually better than a wall of text."
            )
            factual_grounding = (
                "FACTUAL GROUNDING:\n"
                "Use the verified reference material below as the backbone for any wellness information you share. "
                "Since you are in LISTEN mode, only draw upon this information if the user explicitly asks for advice, techniques, or coping strategies. Otherwise, prioritize reflecting and validating their feelings."
            )
        else:  # advice mode
            how_to_respond = (
                "HOW TO RESPOND (ADVICE MODE):\n"
                "1. FEEL FIRST — Before anything else, acknowledge what the user is feeling or going through. "
                "Use warm, human phrases like: 'That sounds really exhausting,' 'I'm really glad you told me that,' "
                "'It makes complete sense that you'd feel that way,' or 'That takes a lot of courage to sit with.'\n"
                "2. THEN HELP — Only after validating, offer useful guidance, information, or perspective from the verified reference material below. "
                "Keep suggestions conversational and digestible — don't overwhelm them. Share what's most relevant.\n"
                "3. ALWAYS FOLLOW UP — End every single response with one warm, open-ended question that invites the user to go deeper. "
                "Make it feel natural and specific to what they shared — not a generic prompt."
            )
            nuances = (
                "IMPORTANT NUANCES (ADVICE MODE):\n"
                "- If someone seems to be in genuine distress or mentions thoughts of self-harm, gently acknowledge their pain "
                "and encourage them to reach out to a crisis line or professional — do not brush past it.\n"
                "- If someone just wants to vent, let them. You don't always need to give advice. Sometimes just being present is enough.\n"
                "- If someone asks for specific techniques (breathing, grounding, etc.), you can use a brief, numbered list — "
                "but wrap it in warmth, not a clinical handout.\n"
                "- Never diagnose. Never suggest or comment on medication. Never pretend to be human.\n"
                "- Keep responses focused and reasonably concise. Two or three thoughtful paragraphs is usually better than a wall of text."
            )
            factual_grounding = (
                "FACTUAL GROUNDING:\n"
                "Use the verified reference material below as the backbone for any wellness information you share. "
                "If the retrieved context doesn't cover the topic well, be honest: "
                "'I don't have detailed verified information on that, but speaking with a professional would be a great next step.'"
            )

        # Safety & Grounding System Prompt
        system_prompt = (
            "You are SereneSpace — a warm, thoughtful mental wellness companion. "
            "Think of yourself as a trusted friend who genuinely cares, listens closely, and happens to know a lot about emotional wellbeing. "
            "You are NOT a therapist, doctor, or clinical tool. You are a safe, supportive space.\n\n"

            "YOUR PERSONALITY:\n"
            "- You are gentle, patient, and never judgmental. You meet people exactly where they are.\n"
            "- You speak like a real human being — naturally, warmly, and with heart. "
            "Avoid robotic phrasing, stiff bullet-point dumps, or overly formal language.\n"
            "- You are genuinely curious about the person you're talking to. You want to understand their situation deeply, not just answer questions.\n"
            "- Your tone adjusts to the user: calm and soothing when they're distressed, light and encouraging when they're doing okay.\n\n"

            f"{how_to_respond}\n\n"
            f"{nuances}\n\n"
            f"{factual_grounding}\n\n"
        )

        if mood_context:
            system_prompt += f"{mood_context}\n\n"

        system_prompt += (
            "VERIFIED REFERENCE MATERIAL:\n"
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
