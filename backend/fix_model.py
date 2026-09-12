with open(r'C:\Users\parma\academic-ai-assistant\backend\app\services\rag_service.py', 'r') as f:
    content = f.read()

# Replace model name references
content = content.replace('self.model_name = "grok-1"', 'self.model_name = "grok-2"')
content = content.replace('self.model_name = "grok-beta"', 'self.model_name = "grok-2"')

# Also fix the Grok model initialization to try grok-2
content = content.replace('"grok-beta"', '"grok-2"')

with open(r'C:\Users\parma\academic-ai-assistant\backend\app\services\rag_service.py', 'w') as f:
    f.write(content)
print('Fixed model name references')