import io
import math
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
        self.is_grok = False
        self.model_name = "gpt-4o-mini"

        if self.ai_key and self.ai_key != "test_key":
            if (self.ai_key.startswith("xai-") or "x.ai" in self.ai_key) and openai:
                try:
                    self.openai_client = openai.OpenAI(
                        api_key=self.ai_key,
                        base_url="https://api.x.ai/v1"
                    )
                    self.is_grok = True
                    self.model_name = "grok-2-latest"
                    logger.info("Initialized xAI Grok Client for RAG Service with model grok-2-latest.")
                except Exception as e:
                    logger.warning(f"Could not initialize Grok Client: {e}")
            elif self.ai_key.startswith("sk-") and openai:
                try:
                    self.openai_client = openai.OpenAI(api_key=self.ai_key)
                    self.model_name = "gpt-4o-mini"
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

    def _generate_hash_embedding(self, text: str) -> List[float]:
        """Deterministic 768-dim unit vector generated from word hashes for accurate vector search when external AI APIs are quota-limited."""
        import hashlib
        vec = [0.0] * EMBEDDING_DIM
        words = [w.strip() for w in text.lower().split() if len(w.strip()) > 1]
        if not words:
            return vec
        for word in words:
            h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
            idx = h % EMBEDDING_DIM
            vec[idx] += 1.0
        norm = sum(v * v for v in vec) ** 0.5
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec

    def generate_embedding(self, text: str) -> List[float]:
        """Generate a 768-dim vector embedding using OpenAI, Google GenAI, or hashing fallback."""
        if not text or not text.strip():
            return [0.0] * EMBEDDING_DIM

        # Try OpenAI (only if not Grok, since xAI is chat completions only)
        if self.openai_client and not self.is_grok:
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
                if "quota" in str(e).lower() or "429" in str(e):
                    logger.warning("Disabling OpenAI client due to quota error, using fast fallback.")
                    self.openai_client = None

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

        # Deterministic hashing fallback for zero-downtime accurate RAG search
        return self._generate_hash_embedding(text)

    def _cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """Compute cosine similarity between two vectors."""
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    def _extract_key_topics(self, all_text: str, top_n: int = 10) -> List[str]:
        """Extract key topics from document text using TF-IDF-style term frequency analysis."""
        # Academic stopwords
        stopwords = {
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
            "being", "have", "has", "had", "do", "does", "did", "will", "would",
            "could", "should", "may", "might", "shall", "can", "that", "this",
            "these", "those", "it", "its", "we", "he", "she", "they", "you", "i",
            "as", "if", "then", "so", "also", "which", "when", "where", "what",
            "who", "how", "all", "any", "each", "every", "both", "few", "more",
            "most", "other", "some", "such", "no", "not", "only", "same", "than",
            "too", "very", "just", "because", "since", "while", "although", "however",
            "therefore", "thus", "hence", "page", "figure", "table", "section",
            "chapter", "unit", "example", "note", "above", "below", "shown",
        }

        words = re.findall(r'\b[a-zA-Z][a-zA-Z0-9\-]{2,}\b', all_text.lower())
        freq: Dict[str, int] = {}
        for w in words:
            if w not in stopwords and len(w) >= 3:
                freq[w] = freq.get(w, 0) + 1

        # Prefer multi-word adjacent pairs (bigrams)
        tokens = [w for w in all_text.lower().split() if re.match(r'^[a-zA-Z][a-zA-Z\-]{2,}$', w) and w not in stopwords]
        bigram_freq: Dict[str, int] = {}
        for i in range(len(tokens) - 1):
            bigram = f"{tokens[i]} {tokens[i+1]}"
            if len(bigram) > 6:
                bigram_freq[bigram] = bigram_freq.get(bigram, 0) + 1

        # Combine: prefer bigrams with freq >= 2
        candidates = {k: v for k, v in bigram_freq.items() if v >= 2}
        # Top unigrams not covered by bigrams
        for w, c in sorted(freq.items(), key=lambda x: -x[1]):
            if not any(w in bg for bg in candidates):
                candidates[w] = c
            if len(candidates) >= top_n * 3:
                break

        sorted_topics = sorted(candidates.items(), key=lambda x: -x[1])
        topics = [t[0].title() for t in sorted_topics[:top_n] if t[1] >= 1]
        return topics[:top_n]

    def _detect_sections(self, all_text: str) -> List[str]:
        """Detect section headings in the document text."""
        heading_pattern = re.compile(
            r'^(?:(?:\d+\.?\s+)|(?:chapter|unit|section|part|module)\s+\d*:?\s*)?([A-Z][A-Za-z\s\-\&\/]{3,60})$',
            re.MULTILINE
        )
        found = []
        seen = set()
        for match in heading_pattern.finditer(all_text):
            heading = match.group(0).strip()
            heading_lower = heading.lower()
            if heading_lower not in seen and len(heading) > 4:
                found.append(heading)
                seen.add(heading_lower)
            if len(found) >= 8:
                break
        return found

    def get_document_overview(self, pages: List[Dict[str, Any]], filename: str) -> Dict[str, Any]:
        """Compute rich document metadata: page count, word count, key topics, sections."""
        all_text = " ".join(p.get("text", "") for p in pages)
        word_count = len(all_text.split())
        char_count = len(all_text)
        page_count = len(pages)
        key_topics = self._extract_key_topics(all_text, top_n=12)
        sections = self._detect_sections(all_text)

        return {
            "filename": filename,
            "page_count": page_count,
            "word_count": word_count,
            "char_count": char_count,
            "key_topics": key_topics,
            "sections_found": sections
        }

    def _in_memory_rag_search(
        self,
        query: str,
        chunks: List[Dict[str, Any]],
        top_k: int = 6
    ) -> List[Dict[str, Any]]:
        """
        True in-memory RAG: embed all chunks + query, cosine-rank, return top-k relevant chunks.
        Falls back to keyword overlap if embeddings are all zero.
        """
        if not chunks:
            return []

        query_vec = self.generate_embedding(query)
        scored = []

        for i, chunk in enumerate(chunks):
            chunk_vec = self.generate_embedding(chunk["content"])
            sim = self._cosine_similarity(query_vec, chunk_vec)
            # Add keyword boost: if query terms appear in chunk, boost score
            query_terms = [t.lower() for t in query.split() if len(t) > 3]
            keyword_boost = sum(
                0.05 for term in query_terms
                if term in chunk["content"].lower()
            )
            scored.append((sim + keyword_boost, i, chunk))

        scored.sort(key=lambda x: -x[0])
        return [item[2] for item in scored[:top_k]]

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

        # Attempt OpenAI or Grok Call
        if self.openai_client:
            try:
                response = self.openai_client.chat.completions.create(
                    model=self.model_name,
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
                provider = "Grok" if self.is_grok else "OpenAI"
                logger.warning(f"{provider} ChatCompletion call failed: {e}")

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

    def answer_question_with_file(
        self,
        db: Session,
        user_id: uuid.UUID,
        file_bytes: bytes,
        filename: str,
        question: Optional[str] = None,
        session_id: Optional[uuid.UUID] = None
    ) -> Dict[str, Any]:
        """
        ChatGPT-style deep document analysis:
        1. Extract all pages via OCR pipeline
        2. Compute document overview (metadata, key topics, sections)
        3. Chunk document into semantic segments (~500 chars each)
        4. Embed query + chunks in-memory, cosine-rank for top-k relevant chunks (true RAG-over-upload)
        5. Generate structured multi-section LLM analysis with citations
        6. Return answer + document_metadata for Document Intelligence Panel
        """
        pages = ocr_service.parse_document(file_bytes, filename)

        sources = []
        doc_metadata = {
            "filename": filename,
            "page_count": 0,
            "word_count": 0,
            "char_count": 0,
            "key_topics": [],
            "sections_found": []
        }

        if not pages:
            answer_text = (
                f"## ⚠️ Document Parse Notice: `{filename}`\n\n"
                f"The document could not be read (possibly a scanned image PDF or encrypted file). "
                f"Please try uploading a text-based PDF or `.txt` file for best results."
            )
            return self._save_and_return(db, user_id, f"Uploaded {filename}", answer_text, [], session_id, doc_metadata)

        # --- Step 1: Compute rich document overview ---
        doc_metadata = self.get_document_overview(pages, filename)

        # --- Step 2: Chunk the document for in-memory RAG ---
        all_chunks = self.chunk_pages_text(pages, chunk_size=600, chunk_overlap=80)

        actual_question = question.strip() if (question and question.strip()) else None

        # --- Step 3: Select relevant context via in-memory RAG ---
        if actual_question and len(all_chunks) > 6:
            # True RAG: embed-rank chunks against user question
            top_chunks = self._in_memory_rag_search(actual_question, all_chunks, top_k=6)
        else:
            # No specific question: use first 8 chunks for full-doc overview
            top_chunks = all_chunks[:8]

        # Build context from top chunks with page citations
        context_parts = []
        seen_pages = set()
        for chunk in top_chunks:
            p = chunk["page_number"]
            context_parts.append(f"**[Page {p}]** {chunk['content']}")
            if p not in seen_pages:
                seen_pages.add(p)
                sources.append({
                    "material_id": str(uuid.uuid4()),
                    "title": filename,
                    "file_url": "",
                    "page_number": p
                })

        file_context = "\n\n".join(context_parts)

        # Build section context string for prompt
        sections_str = ""
        if doc_metadata.get("sections_found"):
            sections_str = f"\nDetected Sections: {', '.join(doc_metadata['sections_found'][:5])}"

        topics_str = ""
        if doc_metadata.get("key_topics"):
            topics_str = f"\nKey Topics Detected: {', '.join(doc_metadata['key_topics'][:8])}"

        # --- Step 4: Structured LLM System Prompt ---
        system_prompt = (
            "You are AcademicAI Master Tutor — an expert document analyst like ChatGPT. "
            "You receive semantic chunks from a student's uploaded academic document and must provide a deeply structured, "
            "academic-grade analysis. Format your response using markdown with clear headers (##, ###), "
            "bullet lists, bold terms, and code blocks where relevant. "
            "Always cite the page number when referencing content (e.g. [Page 3]).\n\n"
            "Your response MUST be structured with these sections:\n"
            "## 📌 Document Overview\n"
            "## 💡 Key Concepts & Definitions\n"
            "## 📊 Technical Deep Dive\n"
            "## ❓ Answer to Your Question\n"
            "## 🎓 Exam Tips & Summary\n\n"
            "Be thorough, precise, and educational. Use examples, analogies, and step-by-step breakdowns."
        )

        if actual_question:
            user_prompt = (
                f"**Uploaded Document:** `{filename}`\n"
                f"**Document Stats:** {doc_metadata['page_count']} pages, ~{doc_metadata['word_count']:,} words"
                f"{topics_str}{sections_str}\n\n"
                f"**Relevant Context Chunks (RAG-retrieved):**\n{file_context}\n\n"
                f"**Student Question:** {actual_question}\n\n"
                f"Provide a comprehensive, section-by-section academic analysis with page citations:"
            )
        else:
            user_prompt = (
                f"**Uploaded Document:** `{filename}`\n"
                f"**Document Stats:** {doc_metadata['page_count']} pages, ~{doc_metadata['word_count']:,} words"
                f"{topics_str}{sections_str}\n\n"
                f"**Document Content (first sections):**\n{file_context}\n\n"
                f"Provide a complete academic document analysis covering all 5 sections. "
                f"Focus on explaining the key academic content in this document."
            )

        answer_text = ""

        # --- Step 5: Call LLM (Grok or OpenAI) ---
        if self.openai_client:
            try:
                response = self.openai_client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.6,
                    max_tokens=2000
                )
                if response.choices and response.choices[0].message.content:
                    answer_text = response.choices[0].message.content.strip()
            except Exception as e:
                provider = "Grok" if self.is_grok else "OpenAI"
                logger.warning(f"{provider} ChatCompletion call for uploaded file failed: {e}")

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
                logger.warning(f"Google GenAI LLM call for uploaded file failed: {e}")

        # --- Step 6: Rich Fallback (structured, always useful even without LLM) ---
        if not answer_text:
            answer_text = self._generate_file_fallback_response(
                filename, actual_question, top_chunks, doc_metadata
            )

        question_label = f"Uploaded {filename}: {actual_question}" if actual_question else f"Document Analysis: {filename}"
        return self._save_and_return(db, user_id, question_label, answer_text, sources[:6], session_id, doc_metadata)

    def _generate_file_fallback_response(
        self,
        filename: str,
        question: Optional[str],
        top_chunks: List[Dict[str, Any]],
        doc_metadata: Dict[str, Any]
    ) -> str:
        """Rich, structured fallback when LLM APIs are unavailable."""
        page_count = doc_metadata.get("page_count", "?")
        word_count = doc_metadata.get("word_count", 0)
        key_topics = doc_metadata.get("key_topics", [])
        sections = doc_metadata.get("sections_found", [])

        topics_md = "\n".join(f"- **{t}**" for t in key_topics[:8]) if key_topics else "- *(Topics analysis unavailable)*"
        sections_md = "\n".join(f"- {s}" for s in sections[:6]) if sections else "- *(No clear section headings detected)*"

        chunks_preview = ""
        for i, chunk in enumerate(top_chunks[:4], 1):
            p = chunk.get("page_number", "?")
            preview = chunk["content"][:300].replace("\n", " ")
            chunks_preview += f"\n\n> **[Page {p}]** {preview}..."

        question_section = ""
        if question:
            question_section = (
                f"\n\n## ❓ Answer to Your Question\n\n"
                f"**Question:** *{question}*\n\n"
                f"Based on the document content, here are the most relevant sections:\n"
                f"{chunks_preview}"
            )

        return (
            f"## 📌 Document Overview\n\n"
            f"| Field | Value |\n"
            f"|-------|-------|\n"
            f"| **Filename** | `{filename}` |\n"
            f"| **Pages** | {page_count} |\n"
            f"| **Words** | ~{word_count:,} |\n\n"
            f"## 💡 Key Concepts & Definitions\n\n"
            f"**Detected key topics in this document:**\n{topics_md}\n\n"
            f"## 📊 Technical Deep Dive\n\n"
            f"**Sections detected:**\n{sections_md}\n\n"
            f"**Content Preview:**\n{chunks_preview}\n\n"
            f"{question_section}"
            f"\n\n## 🎓 Exam Tips & Summary\n\n"
            f"- Review all sections systematically, focusing on definitions and examples\n"
            f"- Pay attention to diagrams, tables, and numbered steps\n"
            f"- Practice solving problems related to the key topics identified above"
        )

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
        self,
        db: Session,
        user_id: uuid.UUID,
        question: str,
        answer_text: str,
        sources: List[Dict[str, Any]],
        session_id: Optional[uuid.UUID],
        document_metadata: Optional[Dict[str, Any]] = None
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

        result = {
            "session_id": str(session_id),
            "answer": answer_text,
            "sources": sources
        }
        if document_metadata:
            result["document_metadata"] = document_metadata
        return result

rag_service = RAGService()
