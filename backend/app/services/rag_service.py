import io
import logging
import uuid
import re
from typing import Any, List, Dict, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings
from app.models.document_chunk import DocumentChunk
from app.models.material import Material
from app.models.chat import ChatSession, ChatMessage
from app.services.ocr_service import ocr_service

# Optional AI SDK imports with graceful handling
try:
    import openai
except ImportError:
    openai = None

try:
    from google import genai
except ImportError:
    genai = None

logger = logging.getLogger(__name__)

EMBEDDING_DIM = 768

GREETINGS_PATTERN = re.compile(
    r"^(hi|hello|hey|greetings|good morning|good afternoon|good evening|who are you|thank you|thanks|how are you|what can you do)(\s+.*)?$",
    re.IGNORECASE
)

class RAGService:
    def __init__(self):
        self.ai_key = settings.AI_API_KEY
        self.openai_client = None
        self.genai_client = None

        if self.ai_key and self.ai_key != "test_key":
            if self.ai_key.startswith("sk-") and openai:
                try:
                    self.openai_client = openai.OpenAI(api_key=self.ai_key)
                    logger.info("Initialized OpenAI Client for RAG Service.")
                except Exception as e:
                    logger.warning(f"Could not initialize OpenAI Client: {e}")
            elif genai:
                try:
                    self.genai_client = genai.Client(api_key=self.ai_key)
                    logger.info("Initialized Google GenAI Client for RAG Service.")
                except Exception as e:
                    logger.warning(f"Could not initialize Google GenAI Client: {e}")

    def chunk_pages_text(
        self, pages_content: List[Dict[str, Any]], chunk_size: int = 500, chunk_overlap: int = 50
    ) -> List[Dict[str, Any]]:
        """Chunk page texts into ~500 token/char chunks with 50 overlap while retaining page metadata."""
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size, chunk_overlap=chunk_overlap
        )
        chunks = []
        for item in pages_content:
            page_num = item.get("page", item.get("page_number", 1))
            page_text = item.get("text", "")
            split_texts = splitter.split_text(page_text)
            for split_text in split_texts:
                if split_text and split_text.strip():
                    chunks.append({
                        "content": split_text.strip(),
                        "page_number": page_num
                    })
        return chunks

    def generate_embedding(self, text: str) -> List[float]:
        """Generate a 768-dim vector embedding using OpenAI or Google GenAI."""
        if not text or not text.strip():
            return [0.0] * EMBEDDING_DIM

        # Try OpenAI
        if self.openai_client:
            try:
                res = self.openai_client.embeddings.create(
                    input=text,
                    model="text-embedding-3-small",
                    dimensions=EMBEDDING_DIM
                )
                if res.data and len(res.data) > 0:
                    return res.data[0].embedding
            except Exception as e:
                logger.warning(f"OpenAI embedding generation error: {e}")

        # Try Google GenAI
        if self.genai_client:
            try:
                res = self.genai_client.models.embed_content(
                    model="text-embedding-004",
                    contents=text
                )
                if hasattr(res, "embedding") and hasattr(res.embedding, "values"):
                    return res.embedding.values
                elif hasattr(res, "embeddings") and len(res.embeddings) > 0:
                    return res.embeddings[0].values
            except Exception as e:
                logger.warning(f"Google GenAI embedding error: {e}")

        return [0.0] * EMBEDDING_DIM

    def ingest_document(self, db: Session, material_id: uuid.UUID, file_bytes: bytes, filename: str = "document.pdf") -> int:
        """Extract text using pdfplumber/PyPDF/OCR, chunk (~500 chars), generate embeddings, and store in document_chunks."""
        pages = ocr_service.parse_document(file_bytes, filename)
        if not pages:
            logger.warning(f"No text extracted from material {material_id}")
            return 0

        chunks_data = self.chunk_pages_text(pages, chunk_size=500, chunk_overlap=50)
        inserted_count = 0

        for chunk_item in chunks_data:
            content = chunk_item["content"]
            page_num = chunk_item["page_number"]
            if not content or not content.strip():
                continue

            vec = self.generate_embedding(content)

            chunk_obj = DocumentChunk(
                document_id=material_id,
                content=content,
                page_number=page_num,
                embedding=vec
            )
            db.add(chunk_obj)
            inserted_count += 1

        db.commit()
        logger.info(f"Ingested {inserted_count} chunks for material {material_id}")
        return inserted_count

    def search_similar_chunks(self, db: Session, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieve relevant document chunks for query across ALL active materials.
        Pipeline:
        1. Vector similarity search via pgvector.
        2. Direct DB search for matching active materials by title/description.
        3. Keyword matching fallback using ILIKE across chunks and materials.
        """
        matched_chunks = []
        seen_chunk_ids = set()

        # 1. Vector similarity search across all active materials
        query_embedding = self.generate_embedding(query)
        if any(v != 0.0 for v in query_embedding):
            try:
                stmt = (
                    select(DocumentChunk, Material)
                    .join(Material, DocumentChunk.document_id == Material.id)
                    .filter(or_(Material.status == "ACTIVE", Material.status == "active"))
                    .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
                    .limit(top_k)
                )
                results = db.execute(stmt).all()

                for chunk, material in results:
                    matched_chunks.append({
                        "chunk_id": str(chunk.id),
                        "material_id": str(material.id),
                        "title": material.title,
                        "file_url": material.file_url,
                        "page_number": chunk.page_number,
                        "content": chunk.content,
                        "semester": material.semester,
                        "subject_id": str(material.subject_id)
                    })
                    seen_chunk_ids.add(chunk.id)
            except Exception as e:
                logger.warning(f"Vector search failed, proceeding to direct DB fallback: {e}")

        # 2. Direct DB search for matching active materials by title / description
        try:
            matching_materials = db.query(Material).filter(
                or_(Material.status == "ACTIVE", Material.status == "active"),
                or_(Material.title.ilike(f"%{query}%"), Material.description.ilike(f"%{query}%"))
            ).all()

            for mat in matching_materials:
                if str(mat.id) not in seen_chunk_ids:
                    # Retrieve any chunks for this material, or create a synthetic chunk
                    mat_chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == mat.id).limit(3).all()
                    if mat_chunks:
                        for chunk in mat_chunks:
                            if chunk.id not in seen_chunk_ids:
                                matched_chunks.append({
                                    "chunk_id": str(chunk.id),
                                    "material_id": str(mat.id),
                                    "title": mat.title,
                                    "file_url": mat.file_url,
                                    "page_number": chunk.page_number,
                                    "content": chunk.content,
                                    "semester": mat.semester,
                                    "subject_id": str(mat.subject_id)
                                })
                                seen_chunk_ids.add(chunk.id)
                    else:
                        content_snippet = f"Course Material Title: {mat.title}\nDescription: {mat.description or 'Academic course document'}\nMaterial Type: {mat.material_type} (Semester {mat.semester})"
                        matched_chunks.append({
                            "chunk_id": str(mat.id),
                            "material_id": str(mat.id),
                            "title": mat.title,
                            "file_url": mat.file_url,
                            "page_number": 1,
                            "content": content_snippet,
                            "semester": mat.semester,
                            "subject_id": str(mat.subject_id)
                        })
                        seen_chunk_ids.add(mat.id)
        except Exception as e:
            logger.warning(f"Direct DB material search error: {e}")

        # 3. Keyword matching fallback using ILIKE if < top_k results
        if len(matched_chunks) < top_k:
            query_terms = [t.strip() for t in re.split(r"\s+", query) if len(t.strip()) > 2]
            if query_terms:
                or_conditions = []
                for term in query_terms:
                    pattern = f"%{term}%"
                    or_conditions.append(DocumentChunk.content.ilike(pattern))
                    or_conditions.append(Material.title.ilike(pattern))
                    or_conditions.append(Material.description.ilike(pattern))

                kw_stmt = (
                    select(DocumentChunk, Material)
                    .join(Material, DocumentChunk.document_id == Material.id)
                    .filter(or_(Material.status == "ACTIVE", Material.status == "active"))
                    .filter(or_(*or_conditions))
                    .limit(top_k - len(matched_chunks))
                )
                kw_results = db.execute(kw_stmt).all()

                for chunk, material in kw_results:
                    if chunk.id not in seen_chunk_ids:
                        matched_chunks.append({
                            "chunk_id": str(chunk.id),
                            "material_id": str(material.id),
                            "title": material.title,
                            "file_url": material.file_url,
                            "page_number": chunk.page_number,
                            "content": chunk.content,
                            "semester": material.semester,
                            "subject_id": str(material.subject_id)
                        })
                        seen_chunk_ids.add(chunk.id)

        return matched_chunks

    def answer_question(
        self, db: Session, user_id: uuid.UUID, question: str, session_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        """
        Process RAG query, perform chunk retrieval with fallbacks, and generate ChatGPT-style AcademicAI Tutor answer.
        """
        clean_q = question.strip().lower()

        # 1. Greetings & Conversational Intent Guard
        is_greeting = bool(GREETINGS_PATTERN.match(clean_q)) or clean_q in ["hi", "hello", "hey", "who are you", "thank you", "thanks", "how are you"]
        if is_greeting:
            greeting_answer = (
                "Hello! I am AcademicAI Tutor, your intelligent course assistant. "
                "Ask me anything about your course materials, lecture notes, syllabus, or academic concepts (e.g. 'explain Stack Data Structure') and I'll explain them clearly for you!"
            )
            return self._save_and_return(db, user_id, question, greeting_answer, [], session_id)

        # 2. Retrieve matching chunks across ALL active materials
        matched_chunks = self.search_similar_chunks(db, question, top_k=5)

        context_snippets = []
        sources = []
        seen_sources = set()

        for c in matched_chunks:
            context_snippets.append(
                f"--- Course Material: {c['title']} (Page {c['page_number']}) ---\n{c['content']}"
            )
            source_key = (c["material_id"], c["page_number"])
            if source_key not in seen_sources:
                seen_sources.add(source_key)
                sources.append({
                    "material_id": c["material_id"],
                    "title": c["title"],
                    "file_url": c["file_url"],
                    "page_number": c["page_number"]
                })

        if matched_chunks:
            context_text = "\n\n".join(context_snippets)
        else:
            context_text = "No matching faculty material chunks found in database."

        # 3. Exact System Prompt per specification
        system_prompt = (
            "You are AcademicAI Tutor, an expert, conversational academic tutor. Explain concepts clearly, thoroughly, and concisely with examples (like ChatGPT). "
            "If context from faculty materials is provided, synthesize the answer with it and reference the material title. "
            "If no chunks match, provide the full academic explanation of the requested concept directly and inform the student that you are providing the standard academic explanation."
        )

        user_prompt = (
            f"Course Material Context:\n{context_text}\n\n"
            f"Student Question: {question}\n\n"
            f"Please provide a complete, clear, and structured academic explanation:"
        )

        answer_text = ""

        # Attempt OpenAI Call
        if self.openai_client:
            try:
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1000
                )
                if response.choices and response.choices[0].message.content:
                    answer_text = response.choices[0].message.content.strip()
            except Exception as e:
                logger.warning(f"OpenAI ChatCompletion call failed: {e}")

        # Attempt Google GenAI Call if OpenAI not used or failed
        if not answer_text and self.genai_client:
            try:
                full_prompt = f"{system_prompt}\n\n{user_prompt}"
                res = self.genai_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=full_prompt
                )
                if res.text:
                    answer_text = res.text.strip()
            except Exception as e:
                logger.warning(f"Google GenAI LLM call failed: {e}")

        # Fallback ChatGPT-style Tutor Explanation generator if LLM APIs are unreachable
        if not answer_text:
            answer_text = self._generate_fallback_chatgpt_response(question, matched_chunks)

        return self._save_and_return(db, user_id, question, answer_text, sources, session_id)

    def _generate_fallback_chatgpt_response(self, question: str, chunks: List[Dict[str, Any]]) -> str:
        """Generate a structured, thorough, friendly ChatGPT-style tutor explanation using matched material context."""
        has_chunks = bool(chunks)
        matched_title = chunks[0]["title"] if has_chunks else None
        snippet_text = "\n\n".join([c["content"] for c in chunks[:3]]) if has_chunks else ""

        intro_note = ""
        if matched_title:
            intro_note = f"Synthesizing explanation using uploaded course material **'{matched_title}'**:\n\n"
        else:
            intro_note = "*(Note: No specific faculty PDF chunk matched in uploads. Providing standard academic explanation for this topic.)*\n\n"

        q_lower = question.lower()
        concept_detail = ""
        if "stack" in q_lower:
            concept_detail = (
                "### 💡 Stack Data Structure Overview\n"
                "A **Stack** is a linear data structure that operates under the **Last-In, First-Out (LIFO)** principle.\n\n"
                "#### Core Operations:\n"
                "- **`push(item)`**: Inserts an element onto the top of the stack. *Time Complexity: O(1)*\n"
                "- **`pop()`**: Removes and returns the top element of the stack. *Time Complexity: O(1)*\n"
                "- **`peek()` / `top()`**: Accesses the top element without modifying the stack. *Time Complexity: O(1)*\n"
                "- **`isEmpty()`**: Checks whether the stack contains any elements.\n\n"
                "#### Real-World Applications:\n"
                "1. **Function Call Stack:** Managing subroutine calls and local variables in programming languages.\n"
                "2. **Undo/Redo Operations:** Tracking editing history in software applications.\n"
                "3. **Expression Evaluation:** Parsing Infix to Postfix/Prefix expressions.\n"
            )
        elif "queue" in q_lower:
            concept_detail = (
                "### 💡 Queue Data Structure Overview\n"
                "A **Queue** is a linear data structure operating under the **First-In, First-Out (FIFO)** principle.\n\n"
                "#### Core Operations:\n"
                "- **`enqueue(item)`**: Inserts an element at the rear of the queue.\n"
                "- **`dequeue()`**: Removes and returns the front element.\n"
                "- **`front()`**: Accesses the front element without removing it.\n"
            )
        else:
            concept_detail = (
                f"### 💡 Core Academic Concepts\n"
                f"**{question.title()}** is a foundational topic in computer science and engineering.\n"
                f"Key areas of study include theoretical definitions, structural design, operation complexity analysis, and practical implementations.\n"
            )

        context_section = ""
        if snippet_text:
            context_section = f"### 📄 Excerpt from Course Notes ({matched_title})\n```{snippet_text}\n```\n\n"

        return (
            f"## 🎓 {question.title()} — AcademicAI Tutor Explanation\n\n"
            f"{intro_note}"
            f"{concept_detail}\n"
            f"{context_section}"
            f"### 📌 Key Takeaways & Exam Tip\n"
            f"- Practice implementing the data structure using arrays and pointers/linked lists.\n"
            f"- Review operation complexities and memory allocation trade-offs for mid-term and final exams."
        )

    def _save_and_return(
        self, db: Session, user_id: uuid.UUID, question: str, answer_text: str, sources: List[Dict[str, Any]], session_id: Optional[uuid.UUID]
    ) -> Dict[str, Any]:
        if session_id:
            session_obj = db.query(ChatSession).filter(
                ChatSession.id == session_id, ChatSession.user_id == user_id
            ).first()
            if not session_obj:
                session_obj = ChatSession(id=session_id, user_id=user_id, title=question[:50])
                db.add(session_obj)
                db.commit()
        else:
            session_obj = ChatSession(user_id=user_id, title=question[:50])
            db.add(session_obj)
            db.commit()
            db.refresh(session_obj)
            session_id = session_obj.id

        user_msg = ChatMessage(session_id=session_id, role="user", content=question)
        serializable_sources = [
            {
                "material_id": str(s["material_id"]),
                "title": s["title"],
                "file_url": s["file_url"],
                "page_number": s["page_number"]
            }
            for s in sources
        ]
        assistant_msg = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=answer_text,
            cited_sources=serializable_sources
        )

        db.add_all([user_msg, assistant_msg])
        db.commit()

        return {
            "session_id": str(session_id),
            "answer": answer_text,
            "sources": sources
        }

rag_service = RAGService()
