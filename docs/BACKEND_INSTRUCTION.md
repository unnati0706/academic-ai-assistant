# Role & Context
You are a Senior Python Backend & AI Engineer building the core API for "AcademicAI", an academic knowledge management system and RAG assistant.

# Project Constraints & Rules
- Language: Python 3.10+
- Framework: FastAPI
- Database & Storage: PostgreSQL with pgvector & Supabase Storage
- Strict Rule: DO NOT hardcode any secrets. Use python-dotenv and Pydantic BaseSettings for .env management.
- Keep business logic strictly divided into: api/ (routes), services/ (RAG, auth, storage), models/ (SQLAlchemy or SQLModels), and schemas/ (Pydantic models).

# Objectives to Implement

1. Project Setup:
   - Provide the complete requirements.txt (fastapi, uvicorn, pydantic, pydantic-settings, sqlalchemy, psycopg2-binary, pgvector, supabase, python-jose, pypdf, langchain-text-splitters, google-genai).
   - Setup `app/core/config.py` parsing DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and AI_API_KEY.
   - Setup database connection session handling in `app/database/session.py`.

2. Database Models & Schema (SQLAlchemy):
   - `users`: id, email, phone, role (enum: 'student', 'faculty_admin'), created_at
   - `students`: id, user_id (FK), name, roll_number, semester, division, branch, status
   - `subjects`: id, name, code, semester, branch
   - `materials`: id, title, description, subject_id (FK), semester, unit, material_type, file_url, uploaded_by (FK), version, status, created_at
   - `question_papers`: id, title, subject_id (FK), exam_type (mid-sem/university), year, semester, file_url, created_at
   - `announcements`: id, title, content, expires_at, created_by (FK), created_at
   - `document_chunks`: id, document_id (FK to materials), content (text), page_number (int), embedding (Vector(1536) or dimension matching chosen model)
   - `chat_sessions` and `chat_messages` (with role, content, and cited_sources json).

3. Core Services:
   - `auth_service.py`: Verify Supabase OTP JWTs and enforce Role-Based Access Control (RBAC) via FastAPI dependencies (`get_current_user`, `require_admin`, `require_student`).
   - `storage_service.py`: Upload/delete files using Supabase Storage python client.
   - `rag_service.py`: 
     * Ingestion: Accept PDF file upload, extract text using PyPDF, chunk text with metadata (page numbers), compute embeddings, and insert into `document_chunks`.
     * Retrieval & Generation: Embed incoming question, query top_k matching chunks from `document_chunks` using pgvector cosine distance `<=>`. Pass context to LLM with a strict prompt: "Answer only using the provided academic context. If the source material does not contain the answer, say 'The provided academic material does not contain information on this topic.'" Return answer and list of source documents + page numbers.

4. REST Endpoints (app/api/v1/):
   - `/auth/verify-otp` & `/auth/me`
   - `/admin/students` (CRUD, admin-only)
   - `/admin/materials` (Upload multipart file + metadata -> trigger storage & RAG ingestion)
   - `/admin/papers` (Upload question papers)
   - `/materials` & `/papers` (GET with query filters: semester, subject, unit, search)
   - `/chat` (POST: question, session_id -> returns answer and sources array)

Inspect and deliver the directory layout, configuration, and complete runnable code for these endpoints.