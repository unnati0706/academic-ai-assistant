import sys
sys.path.insert(0, '.')

from app.core.config import settings

ai_key = settings.AI_API_KEY
print('AI_API_KEY:', ai_key)
print('Key starts with xai-:', ai_key.startswith('xai-') if ai_key else False)
print('Key length:', len(ai_key) if ai_key else 0)

# Try to import openai
try:
    import openai
    print('openai imported successfully')
    client = openai.OpenAI(
        api_key=ai_key,
        base_url="https://api.x.ai/v1"
    )
    print('Grok client created successfully')
except ImportError:
    print('openai not installed')
except Exception as e:
    print(f'Error creating Grok client: {type(e).__name__}: {e}')