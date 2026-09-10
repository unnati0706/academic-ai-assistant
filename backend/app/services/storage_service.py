import logging
import uuid
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

BUCKET_NAME = "academic-documents"

class StorageService:
    def __init__(self):
        self.client: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
        self._ensure_bucket()

    def _ensure_bucket(self):
        """Ensure the academic-documents bucket exists in Supabase Storage."""
        try:
            buckets = self.client.storage.list_buckets()
            bucket_names = [b.name for b in buckets]
            if BUCKET_NAME not in bucket_names:
                self.client.storage.create_bucket(BUCKET_NAME, options={"public": True})
                logger.info(f"Created public Supabase storage bucket: '{BUCKET_NAME}'")
        except Exception as e:
            logger.warning(f"Could not verify/create storage bucket '{BUCKET_NAME}': {e}")

    def upload_file(self, file_bytes: bytes, original_filename: str, content_type: str = "application/pdf") -> str:
        """Upload file to Supabase Storage bucket and return public URL."""
        # Sanitize filename and prepend unique UUID prefix to prevent collisions
        safe_filename = original_filename.replace(" ", "_")
        unique_name = f"{uuid.uuid4().hex}_{safe_filename}"
        
        try:
            self.client.storage.from_(BUCKET_NAME).upload(
                path=unique_name,
                file=file_bytes,
                file_options={"content-type": content_type, "upsert": "true"}
            )
        except Exception as e:
            logger.error(f"Error uploading file {original_filename} to Supabase storage: {e}")
        
        return f"{settings.SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{unique_name}"

    def get_file_url(self, file_path_or_url: str) -> str:
        """Return full public URL for a file path or URL."""
        if not file_path_or_url:
            return ""
        if file_path_or_url.startswith("http://") or file_path_or_url.startswith("https://"):
            return file_path_or_url

        filename = file_path_or_url.split("/")[-1]
        try:
            public_url = self.client.storage.from_(BUCKET_NAME).get_public_url(filename)
            if public_url:
                return public_url
        except Exception as e:
            logger.warning(f"Error resolving public URL for {filename}: {e}")

        return f"{settings.SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{filename}"

    def get_signed_url(self, file_path_or_url: str, expires_in: int = 3600) -> str:
        """Generate signed URL if bucket is private."""
        if not file_path_or_url:
            return ""
        filename = file_path_or_url.split("/")[-1]
        try:
            res = self.client.storage.from_(BUCKET_NAME).create_signed_url(filename, expires_in)
            if isinstance(res, dict) and "signedURL" in res:
                return res["signedURL"]
            elif hasattr(res, "signed_url"):
                return getattr(res, "signed_url")
            elif isinstance(res, str):
                return res
        except Exception as e:
            logger.warning(f"Could not create signed URL for {filename}: {e}")

        return self.get_file_url(file_path_or_url)

    def delete_file(self, file_path_or_url: str) -> bool:
        """Delete file from Supabase storage bucket."""
        filename = file_path_or_url.split("/")[-1]
        try:
            self.client.storage.from_(BUCKET_NAME).remove([filename])
            return True
        except Exception as e:
            logger.error(f"Error deleting file {filename} from Supabase storage: {e}")
            return False

storage_service = StorageService()

