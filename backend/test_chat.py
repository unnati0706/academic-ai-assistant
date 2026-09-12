import traceback
import sys
sys.path.insert(0, '.')

from app.core.config import settings
from app.services.rag_service import rag_service

print('=== Configuration ===')
print('AI_API_KEY:', settings.AI_API_KEY)
print('CORS_ORIGINS:', settings.CORS_ORIGINS)
print('API_V1_STR:', settings.API_V1_STR)
print()
print('=== RAG Service ===')
print('is_grok:', rag_service.is_grok)
print('model_name:', rag_service.model_name)
print('openai_client:', rag_service.openai_client)
print('ai_key:', rag_service.ai_key[:20] if rag_service.ai_key else 'None')
print()

# Test the greeting detection
import re
GREETINGS_PATTERN = re.compile(
    r"^(hi|hello|hey|greetings|good morning|good afternoon|good evening|who are you|thank you|thanks|how are you|what can you do)(\s+.*)?$",
    re.IGNORECASE
)

test_questions = ["hey", "hi", "hello", "how are you"]

for q in test_questions:
    clean_q = q.strip().lower()
    is_greeting = bool(GREETINGS_PATTERN.match(clean_q)) or clean_q in ["hi", "hello", "hey", "who are you", "thank you", "thanks", "how are you"]
    print(f'Question: "{q}" -> clean_q: "{clean_q}" -> is_greeting: {is_greeting}')