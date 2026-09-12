import codecs
filepath = r'C:\Users\parma\academic-ai-assistant\backend\app\services\rag_service.py'
content = codecs.open(filepath, 'r', encoding='utf-8', errors='replace').read()

# Disable Grok initialization since xAI has no credits
# Skip the xAI/Grok block in __init__
content = content.replace(
    'if (self.ai_key.startswith("xai-") or "x.ai" in self.ai_key) and openai:',
    'if False and (self.ai_key.startswith("xai-") or "x.ai" in self.ai_key) and openai:'
)

codecs.open(filepath, 'w', encoding='utf-8').write(content)
print('Disabled Grok client')