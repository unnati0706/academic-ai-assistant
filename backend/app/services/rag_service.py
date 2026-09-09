import io
import logging
import uuid
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

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-004"
LLM_MODEL = "gemini-2.5-flash"
EMBEDDING_DIM = 768

class RAGService:
    def __init__(self):
        self.ai_key = settings.AI_API_KEY
        self.client = None
        if self.ai_key and self.ai_key != "test_key":
            try:
                self.client = genai.Client(api_key=self.ai_key)
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI Client: {e}")

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> list[dict[str, Any]]:
        """Extract text from PDF file bytes page by page."""
        pages_content = []
        try:
            reader = PdfReader(io.BytesIO(pdf_bytes))
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                if text.strip():
                    pages_content.append({"page_number": i + 1, "text": text})
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
        return pages_content

    def chunk_pages_text(
        self, pages_content: list[dict[str, Any]], chunk_size: int = 1000, chunk_overlap: int = 150
    ) -> list[dict[str, Any]]:
        """Chunk page texts while retaining page number metadata."""
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size, chunk_overlap=chunk_overlap
        )
        chunks = []
        for item in pages_content:
            page_num = item["page_number"]
            page_text = item["text"]
            split_texts = splitter.split_text(page_text)
            for split_text in split_texts:
                if split_text.strip():
                    chunks.append({
                        "content": split_text.strip(),
                        "page_number": page_num
                    })
        return chunks

    def generate_embedding(self, text: str) -> list[float]:
        """Generate a 768-dim vector embedding using Google GenAI."""
        if not self.client:
            # Fallback zero vector for testing/mock mode when API key is missing/placeholder
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

    def ingest_document(self, db: Session, material_id: uuid.UUID, pdf_bytes: bytes) -> int:
        """Extract PDF text, chunk, compute embeddings, and insert into document_chunks."""
        pages = self.extract_text_from_pdf(pdf_bytes)
        if not pages:
            logger.warning(f"No text extracted from material {material_id}")
            return 0

        chunks_data = self.chunk_pages_text(pages)
        inserted_count = 0

        for chunk_item in chunks_data:
            content = chunk_item["content"]
            page_num = chunk_item["page_number"]
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

        # Order by cosine distance between chunk embedding and query embedding
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
        """Perform RAG search, format strict prompt, invoke LLM, and return answer + sources."""
        # 1. Retrieve top 5 matching context chunks
        matched_chunks = self.search_similar_chunks(db, question, top_k=5)

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

        # 2. Strict system prompt per specification
        system_instruction = (
            "Answer only using the provided academic context. "
            "If the source material does not contain the answer, say "
            "'The provided academic material does not contain information on this topic.'"
        )

        prompt = (
            f"System Directive: {system_instruction}\n\n"
            f"Academic Context:\n{context_text if context_text else 'No matching academic material found.'}\n\n"
            f"User Question: {question}\n\n"
            f"Answer:"
        )

        # 3. Invoke LLM or generate response
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
                answer_text = (
                    "The provided academic material does not contain information on this topic."
                )
        else:
            # Fallback when LLM API key is test/mock
            if matched_chunks:
                answer_text = f"Based on academic materials:\n{matched_chunks[0]['content'][:300]}..."
            else:
                answer_text = "The provided academic material does not contain information on this topic."

        # 4. Handle Chat Session and Chat Messages in DB
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

        # Save user message
        user_msg = ChatMessage(
            session_id=session_id,
            role="user",
            content=question
        )
        # Save assistant response message with cited sources JSON
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
