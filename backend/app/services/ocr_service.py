import io
import logging
import urllib.request
import urllib.parse
import json
import uuid
from typing import Any, List, Dict
from pypdf import PdfReader
from app.core.config import settings

logger = logging.getLogger(__name__)

OCR_SPACE_URL = "https://api.ocr.space/parse/image"

class OCRService:
    def parse_document(self, file_bytes: bytes, filename: str = "document.pdf") -> List[Dict[str, Any]]:
        """
        Parse uploaded document bytes using OCR.space REST API with automatic pypdf safety net fallback.
        Returns a list of page objects: [{"page": 1, "text": "..."}]
        """
        parsed_pages = []
        
        # 1. Attempt OCR.space API parsing
        if settings.OCR_SPACE_API_KEY:
            try:
                parsed_pages = self._call_ocr_space(file_bytes, filename)
            except Exception as e:
                logger.warning(f"OCR.space API call failed: {e}. Falling back to local pypdf parser.")

        # 2. Fallback to pypdf if OCR.space returned empty results or failed
        if not parsed_pages or not any(p.get("text", "").strip() for p in parsed_pages):
            logger.info("Using pypdf extraction fallback.")
            parsed_pages = self._fallback_pypdf(file_bytes)

        return parsed_pages

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

    def _fallback_pypdf(self, file_bytes: bytes) -> List[Dict[str, Any]]:
        pages_content = []
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            for i, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                if text.strip():
                    pages_content.append({"page": i + 1, "text": text.strip()})
        except Exception as e:
            logger.error(f"Error in pypdf fallback extraction: {e}")
        return pages_content

ocr_service = OCRService()
