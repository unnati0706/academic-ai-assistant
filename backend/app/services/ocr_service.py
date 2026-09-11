import io
import logging
import urllib.request
import urllib.parse
import json
import uuid
from typing import Any, List, Dict
from pypdf import PdfReader
try:
    import pdfplumber
except ImportError:
    pdfplumber = None

from app.core.config import settings

logger = logging.getLogger(__name__)

OCR_SPACE_URL = "https://api.ocr.space/parse/image"

class OCRService:
    def parse_document(self, file_bytes: bytes, filename: str = "document.pdf") -> List[Dict[str, Any]]:
        """
        Parse uploaded document bytes into page objects: [{"page": 1, "text": "..."}]
        Extraction pipeline:
        1. Direct UTF-8 text check (for .txt / .md files).
        2. pdfplumber extraction.
        3. PyPDF extraction fallback.
        4. OCR.space REST API for scanned/image PDFs.
        """
        if not file_bytes:
            return []

        # 1. Plain text / Markdown check (non-binary or text file extension)
        fname_lower = filename.lower()
        if fname_lower.endswith((".txt", ".md", ".csv")) or not file_bytes.startswith(b"%PDF"):
            try:
                decoded_text = file_bytes.decode("utf-8", errors="ignore").strip()
                if decoded_text:
                    logger.info(f"Successfully extracted text directly from text file {filename}")
                    return [{"page": 1, "text": decoded_text}]
            except Exception as e:
                logger.debug(f"Direct UTF-8 decode failed for {filename}: {e}")

        parsed_pages: List[Dict[str, Any]] = []

        # 2. Primary: pdfplumber extraction
        if pdfplumber:
            try:
                parsed_pages = self._extract_pdfplumber(file_bytes)
                if parsed_pages and any(p.get("text", "").strip() for p in parsed_pages):
                    logger.info(f"Successfully extracted {len(parsed_pages)} pages via pdfplumber.")
                    return parsed_pages
            except Exception as e:
                logger.warning(f"pdfplumber extraction failed for {filename}: {e}")

        # 3. Secondary: PyPDF fallback
        try:
            parsed_pages = self._extract_pypdf(file_bytes)
            if parsed_pages and any(p.get("text", "").strip() for p in parsed_pages):
                logger.info(f"Successfully extracted {len(parsed_pages)} pages via pypdf.")
                return parsed_pages
        except Exception as e:
            logger.warning(f"PyPDF fallback extraction failed for {filename}: {e}")

        # 4. Tertiary: OCR.space API fallback (for scanned image PDFs)
        if settings.OCR_SPACE_API_KEY:
            try:
                parsed_pages = self._call_ocr_space(file_bytes, filename)
                if parsed_pages:
                    logger.info(f"Successfully extracted {len(parsed_pages)} pages via OCR.space.")
                    return parsed_pages
            except Exception as e:
                logger.warning(f"OCR.space API call failed for {filename}: {e}")

        logger.warning(f"All extraction methods yielded no text for document {filename}")
        return []

    def _extract_pdfplumber(self, file_bytes: bytes) -> List[Dict[str, Any]]:
        pages_content = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for i, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                if text.strip():
                    pages_content.append({"page": i + 1, "text": text.strip()})
        return pages_content

    def _extract_pypdf(self, file_bytes: bytes) -> List[Dict[str, Any]]:
        pages_content = []
        reader = PdfReader(io.BytesIO(file_bytes))
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if text.strip():
                pages_content.append({"page": i + 1, "text": text.strip()})
        return pages_content

    def _call_ocr_space(self, file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
        boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
        
        form_fields = {
            "apikey": settings.OCR_SPACE_API_KEY,
            "language": "eng",
            "isOverlayRequired": "False",
            "detectOrientation": "True",
            "scale": "True"
        }

        body = bytearray()
        for key, value in form_fields.items():
            body.extend(f"--{boundary}\r\n".encode("utf-8"))
            body.extend(f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode("utf-8"))
            body.extend(f"{value}\r\n".encode("utf-8"))

        content_type = "application/pdf" if filename.lower().endswith(".pdf") else "image/png"
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'.encode("utf-8"))
        body.extend(f"Content-Type: {content_type}\r\n\r\n".encode("utf-8"))
        body.extend(file_bytes)
        body.extend(b"\r\n")
        body.extend(f"--{boundary}--\r\n".encode("utf-8"))

        req = urllib.request.Request(
            OCR_SPACE_URL,
            data=bytes(body),
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            res_body = response.read().decode("utf-8")
            data = json.loads(res_body)

        pages = []
        if isinstance(data, dict) and "ParsedResults" in data and data["ParsedResults"]:
            for i, result in enumerate(data["ParsedResults"]):
                text = result.get("ParsedText", "").strip()
                if text:
                    pages.append({"page": i + 1, "text": text})

        return pages

ocr_service = OCRService()
