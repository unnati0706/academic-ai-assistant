import io
import logging
import uuid
import re
from typing import Any
from pypdf import PdfReader
from sqlalchemy.orm import Session
from sqlalchemy import select
from langchain_text_splitters import RecursiveCharacterTextSplitter
from google import genai
from google.genai import types

from app.core.config import settings
from app.models.document_chunk import DocumentChunk
from app.models.material import Material
from app.models.chat import ChatSession, ChatMessage
from app.services.ocr_service import ocr_service

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-004"
LLM_MODEL = "gemini-2.5-flash"
EMBEDDING_DIM = 768

GREETINGS_PATTERN = re.compile(
    r"^(hi|hello|hey|greetings|good morning|good afternoon|good evening|who are you|thank you|thanks|how are you|what can you do)(\s+.*)?$",
    re.IGNORECASE
)

STRICT_FALLBACK_TEXT = (
    "I could not find relevant explanations for this in the uploaded faculty materials. "
    "Please verify if notes for this topic are uploaded."
)

class RAGService:
    def __init__(self):
        self.ai_key = settings.AI_API_KEY
        self.client = None
        if self.ai_key and self.ai_key != "test_key":
            try:
                self.client = genai.Client(api_key=self.ai_key)
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI Client: {e}")

    def chunk_pages_text(
        self, pages_content: list[dict[str, Any]], chunk_size: int = 500, chunk_overlap: int = 50
    ) -> list[dict[str, Any]]:
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

    def generate_embedding(self, text: str) -> list[float]:
        """Generate a 768-dim vector embedding using Google GenAI."""
        if not self.client:
            return [0.0] * EMBEDDING_DIM

        try:
            res = self.client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text
            )
            if hasattr(res, "embedding") and hasattr(res.embedding, "values"):
                return res.embedding.values
            elif hasattr(res, "embeddings") and len(res.embeddings) > 0:
                return res.embeddings[0].values
        except Exception as e:
            logger.error(f"Google GenAI embedding error: {e}")

        return [0.0] * EMBEDDING_DIM

    def ingest_document(self, db: Session, material_id: uuid.UUID, file_bytes: bytes, filename: str = "document.pdf") -> int:
        """Extract text using OCR.space service (with pypdf fallback), chunk (~500 tokens), generate embeddings, and store in document_chunks."""
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

    def search_similar_chunks(self, db: Session, query: str, top_k: int = 5) -> list[dict[str, Any]]:
        """Perform vector search using pgvector cosine distance."""
        query_embedding = self.generate_embedding(query)

        stmt = (
            select(DocumentChunk, Material)
            .join(Material, DocumentChunk.document_id == Material.id)
            .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
            .limit(top_k)
        )
        results = db.execute(stmt).all()

        matched_chunks = []
        for chunk, material in results:
            matched_chunks.append({
                "chunk_id": chunk.id,
                "material_id": material.id,
                "title": material.title,
                "file_url": material.file_url,
                "page_number": chunk.page_number,
                "content": chunk.content
            })
        return matched_chunks

    def answer_question(
        self, db: Session, user_id: uuid.UUID, question: str, session_id: uuid.UUID | None = None
    ) -> dict[str, Any]:
        """Perform RAG search with Intent Guard, strict fallback message, and source citations."""
        clean_q = question.strip().lower()

        # 1. Conversational Intent Guard for greetings / chitchat
        is_greeting = bool(GREETINGS_PATTERN.match(clean_q)) or clean_q in ["hi", "hello", "hey", "who are you", "thank you", "thanks", "how are you"]
        if is_greeting:
            greeting_answer = "Hello! I am AcademicAI, your intelligent course tutor. How can I help you with your academic study materials today?"
            return self._save_and_return(db, user_id, question, greeting_answer, [], session_id)

        # 2. Retrieve top matching context chunks
        matched_chunks = self.search_similar_chunks(db, question, top_k=5)

        if not matched_chunks:
            return self._save_and_return(db, user_id, question, STRICT_FALLBACK_TEXT, [], session_id)

        # Build context string
        context_snippets = []
        sources = []
        seen_sources = set()

        for c in matched_chunks:
            context_snippets.append(
                f"--- Document: {c['title']} (Page {c['page_number']}) ---\n{c['content']}"
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

        context_text = "\n\n".join(context_snippets)

        # 3. Strict system prompt per specification
        system_instruction = (
            "Answer only using the provided academic context. "
            f"If the source material does not contain the answer, reply strictly with: '{STRICT_FALLBACK_TEXT}'"
        )

        prompt = (
            f"System Directive: {system_instruction}\n\n"
            f"Academic Context:\n{context_text}\n\n"
            f"User Question: {question}\n\n"
            f"Answer:"
        )

        answer_text = ""
        if self.client:
            try:
                res = self.client.models.generate_content(
                    model=LLM_MODEL,
                    contents=prompt
                )
                answer_text = res.text.strip() if res.text else ""
            except Exception as e:
                logger.error(f"Error calling Google GenAI LLM: {e}")
                answer_text = STRICT_FALLBACK_TEXT
        else:
            if matched_chunks:
                answer_text = f"Based on faculty material '{matched_chunks[0]['title']}' (Page {matched_chunks[0]['page_number']}):\n\n{matched_chunks[0]['content']}"
            else:
                answer_text = STRICT_FALLBACK_TEXT

        return self._save_and_return(db, user_id, question, answer_text, sources, session_id)

    def _save_and_return(
        self, db: Session, user_id: uuid.UUID, question: str, answer_text: str, sources: list[dict[str, Any]], session_id: uuid.UUID | None
    ) -> dict[str, Any]:
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
            "session_id": session_id,
            "answer": answer_text,
            "sources": sources
        }

rag_service = RAGService()
