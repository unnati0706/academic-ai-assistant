import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wzqtldaqwqmulvfdgkux.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cXRsZGFxd3FtdWx2ZmRna3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NTYyNzgsImV4cCI6MjEwNDUzMjI3OH0.xAsfBeP7iphqMw_xNK8g0JPDYBlm_29IAHW_gpN26zw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Resolves a file URL or path into a fully accessible public URL.
 * Handles full URLs, relative paths, bucket file names, or backend proxy fallback.
 *
 * @param {string} fileUrlOrPath - The file_url or file_path stored in database
 * @param {string} [bucketName='academic-documents'] - Supabase storage bucket name
 * @param {string} [materialId=null] - Material UUID for backend endpoint fallback
 * @returns {string} Fully resolved public URL
 */
export function getDocumentUrl(fileUrlOrPath, bucketName = 'academic-documents', materialId = null) {
  if (!fileUrlOrPath) {
    if (materialId) {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      return `${backendUrl}/materials/${materialId}/view`;
    }
    return '#';
  }

  // Extract pure filename
  const filename = String(fileUrlOrPath).split('/').pop();
  return `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filename}`;
}
