import sys
from sqlalchemy import text, inspect
from app.core.config import settings
from app.database.session import engine, init_db
from app.models import Base

def verify_database():
    print("=" * 60)
    print("Starting Database Connection & Schema Verification")
    print("=" * 60)
    print(f"DATABASE_URL (masked): {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else '...'}")

    # 1. Test Connectivity
    print("\n1. Testing Supabase Postgres Connectivity...")
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1;")).scalar()
            print(f"   [SUCCESS] Connected to Supabase DB! Query output: {result}")
    except Exception as e:
        print(f"   [ERROR] Failed to connect to Supabase DB: {e}")
        sys.exit(1)

    # 2. Run Database Initializer (create pgvector extension & tables)
    print("\n2. Initializing pgvector extension and creating tables...")
    try:
        init_db()
        print("   [SUCCESS] `init_db()` executed without errors.")
    except Exception as e:
        print(f"   [ERROR] Failed during `init_db()` execution: {e}")
        sys.exit(1)

    # 3. Inspect Tables
    print("\n3. Inspecting created tables in public schema...")
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names(schema="public")
        print(f"   Total tables found: {len(tables)}")
        for tbl in sorted(tables):
            cols = [col["name"] for col in inspector.get_columns(tbl, schema="public")]
            print(f"   - Table '{tbl}': {len(cols)} columns ({', '.join(cols[:5])}{'...' if len(cols) > 5 else ''})")
        
        expected_tables = {
            "users", "students", "subjects", "materials",
            "question_papers", "announcements", "document_chunks",
            "chat_sessions", "chat_messages"
        }
        missing = expected_tables - set(tables)
        if missing:
            print(f"\n   [WARNING] Missing expected tables: {missing}")
            sys.exit(1)
        else:
            print("\n   [SUCCESS] All expected models and tables exist on Supabase database!")

    except Exception as e:
        print(f"   [ERROR] Table inspection failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    verify_database()
