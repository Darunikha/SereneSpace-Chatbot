import re
import logging
from typing import Dict, Any, Optional, List
from app.models.schemas import SourceCitation

logger = logging.getLogger(__name__)

class SafetyService:
    # Compile regex patterns for crisis detection (suicide, self-harm, severe distress)
    CRISIS_PATTERNS = [
        re.compile(r"\b(suicid(e|al)?|kill(ing)?\s+my\s*self|end(ing)?\s+my\s+life|want(ing)?\s+to\s+die|don't\s+want\s+to\s+live\s+anymore|better\s+off\s+dead|want\s+to\s+sleep\s+and\s+never\s+wake\s+up)\b", re.IGNORECASE),
        re.compile(r"\b(self\s*harm|cut(ting)?\s+my\s*self|hurt(ing)?\s+my\s*self|burn(ing)?\s+my\s*self|mutilat(e|ion))\b", re.IGNORECASE),
        re.compile(r"\b(overdos(e|ing)|take\s+my\s+own\s+life|end\s+it\s+all|hang\s+my\s*self|swallow\s+pills)\b", re.IGNORECASE),
        re.compile(r"\b(jump\s+off\s+a\s+bridge|shoot\s+my\s*self)\b", re.IGNORECASE)
    ]

    # Pre-canned crisis response
    CRISIS_RESPONSE_TEXT = (
        "It sounds like you are going through an incredibly difficult time, but please know that "
        "you are not alone and there is support available. I am an AI assistant and cannot provide "
        "professional therapy or emergency support, but I strongly encourage you to connect with "
        "people who can help:\n\n"
        "• **In the US & Canada:** Call or text **988** to reach the Suicide & Crisis Lifeline, available 24/7. "
        "It is free and confidential. You can also chat online at [988lifeline.org](https://988lifeline.org/).\n"
        "• **Crisis Text Line:** Text **HOME to 741741** to connect with a crisis counselor 24/7.\n"
        "• **In the UK:** Call **111** for NHS mental health services, or call **116 123** for the Samaritans.\n"
        "• **International:** If you are outside these areas, please contact your local emergency services "
        "(e.g., 911, 999, 112) or go immediately to the nearest hospital emergency room.\n\n"
        "Please consider reaching out to a family member, trusted friend, or healthcare provider right now. "
        "There are people who want to listen and support you."
    )

    # Standard crisis citation
    CRISIS_CITATION = SourceCitation(
        title="Crisis and Support Helpline Resources",
        organization="SAMHSA & NHS",
        url="https://988lifeline.org/",
        topic="crisis support"
    )

    def check_message(self, message: str) -> Optional[Dict[str, Any]]:
        """
        Scans a message for crisis keywords.
        Returns a response dict if a crisis is detected, otherwise returns None.
        """
        sanitized_msg = message.strip()
        
        for pattern in self.CRISIS_PATTERNS:
            if pattern.search(sanitized_msg):
                logger.warning("Crisis pattern detected in user input!")
                return {
                    "is_crisis": True,
                    "response": self.CRISIS_RESPONSE_TEXT,
                    "sources": [self.CRISIS_CITATION]
                }
        
        return None

# Singleton service instance
_safety_service_instance = None

def get_safety_service() -> SafetyService:
    global _safety_service_instance
    if _safety_service_instance is None:
        _safety_service_instance = SafetyService()
    return _safety_service_instance
