import sys
sys.path.insert(0, '.')

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Test 1: Greeting "hey"
print("=== Test 1: Question 'hey' ===")
resp = client.post("/api/v1/chat", json={"question": "hey", "session_id": None})
print(f"Status: {resp.status_code}")
print(f"Response: {resp.text}")
print()

# Test 2: Simple hi
print("=== Test 2: Question 'hi' ===")
resp = client.post("/api/v1/chat", json={"question": "hi", "session_id": None})
print(f"Status: {resp.status_code}")
print(f"Response: {resp.text}")
print()

# Test 3: With session_id
print("=== Test 3: Question 'hey' with session_id ===")
resp = client.post("/api/v1/chat", json={"question": "hey", "session_id": "test-session"})
print(f"Status: {resp.status_code}")
print(f"Response: {resp.text}")