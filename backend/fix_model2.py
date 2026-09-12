import codecs

filepath = r'C:\Users\parma\academic-ai-assistant\backend\app\services\rag_service.py'
content = codecs.open(filepath, 'r', encoding='utf-8', errors='replace').read()

content = content.replace('self.model_name = "grok-1"', 'self.model_name = "grok-2"')
content = content.replace('self.model_name = "grok-beta"', 'self.model_name = "grok-2"')

codecs.open(filepath, 'w', encoding='utf-8').write(content)
print('Fixed model name')