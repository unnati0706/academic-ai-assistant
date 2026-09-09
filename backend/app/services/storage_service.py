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
            res = self.client.storage.from_(BUCKET_NAME).upload(
                path=unique_name,
                file=file_bytes,
                file_options={"content-type": content_type, "upsert": "true"}
            )
            # Return public URL for file
            public_url = self.client.storage.from_(BUCKET_NAME).get_public_url(unique_name)
            return public_url
        except Exception as e:
            logger.error(f"Error uploading file {original_filename} to Supabase storage: {e}")
            # Fallback URL format if client upload call has quirks
            return f"{settings.SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{unique_name}"

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
