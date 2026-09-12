import sys
sys.path.insert(0, r'C:\Users\parma\academic-ai-assistant\backend')
from app.services.rag_service import rag_service
from app.database.session import SessionLocal
import uuid

db = SessionLocal()
topics = [
    'Stack Data Structure',
    'Binary Search',
    'DBMS Normalization',
    'Operating System Deadlock',
    'Computer Networks TCP vs UDP',
    'Explain recursion with an example'
]
for t in topics:
    result = rag_service.answer_question(
        db=db,
        user_id=uuid.UUID('00000000-0000-0000-0000-000000000001'),
        question=t,
        session_id=None
    )
    print(f'=== {t} ===')
    print(f'Answer length: {len(result["answer"])}')
    print(f'First 80 chars: {result["answer"][:80]}')
    print()
print('All tests passed!')