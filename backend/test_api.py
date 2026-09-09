import sys
from fastapi.testclient import TestClient
from app.main import app

def test_fastapi_app():
    print("=" * 60)
    print("Testing AcademicAI FastAPI Application Endpoints")
    print("=" * 60)

    client = TestClient(app)

    # 1. Health check endpoint
    print("\n1. GET /health ...")
    res = client.get("/health")
    print(f"   Status Code: {res.status_code}")
    print(f"   Response: {res.json()}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"

    # 2. OpenAPI Spec JSON
    print("\n2. GET /api/v1/openapi.json ...")
    res = client.get("/api/v1/openapi.json")
    print(f"   Status Code: {res.status_code}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    spec = res.json()
    paths = list(spec.get("paths", {}).keys())
    print(f"   Total registered OpenAPI paths: {len(paths)}")
    for p in sorted(paths):
        print(f"   - {p}")

    # 3. Swagger Docs UI endpoint
    print("\n3. GET /docs ...")
    res = client.get("/docs")
    print(f"   Status Code: {res.status_code}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"

    # 4. Materials GET endpoint
    print("\n4. GET /api/v1/materials ...")
    res = client.get("/api/v1/materials")
    print(f"   Status Code: {res.status_code}")
    print(f"   Response count: {len(res.json())}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"

    # 5. Announcements GET endpoint
    print("\n5. GET /api/v1/announcements ...")
    res = client.get("/api/v1/announcements")
    print(f"   Status Code: {res.status_code}")
    print(f"   Response count: {len(res.json())}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"

    print("\n" + "=" * 60)
    print("ALL API ENDPOINT VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_fastapi_app()
