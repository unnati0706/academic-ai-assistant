'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, Trash2, Archive, ExternalLink, Download, CheckCircle2, AlertCircle, RefreshCw, User, BookOpen } from 'lucide-react';
import { getStoredUser, getStoredToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { getDocumentUrl } from '@/lib/supabase';

export default function FacultyDashboard() {
  const router = useRouter();
  const user = getStoredUser();
  const facultyId = user?.id || "00000000-0000-0000-0000-000000000002";

  // Upload Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('00000000-0000-0000-0000-000000000101');
  const [semester, setSemester] = useState('5');
  const [unit, setUnit] = useState('1');
  const [materialType, setMaterialType] = useState('notes');
  const [file, setFile] = useState(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // History State
  const [materials, setMaterials] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const handleDownload = (fileUrl, fileName) => {
    if (!fileUrl) return;
    const resolvedUrl = getDocumentUrl(fileUrl, 'academic-documents');
    const a = document.createElement('a');
    a.href = resolvedUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = fileName || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    // 1. Guard check: Read auth token from localStorage. Cleanly redirect if missing.
    const token = getStoredToken();
    if (!token) {
      console.warn("Faculty Dashboard: No auth token found. Redirecting to /login.");
      router.push('/login');
      return;
    }
    fetchFacultyHistory();
  }, [router]);

  async function fetchFacultyHistory() {
    const token = getStoredToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setLoadingHistory(true);
    try {
      // Fetch records uploaded by faculty with fallback
      const data = await api.getFacultyMaterials(facultyId).catch(async (err) => {
        console.warn("Primary faculty materials fetch warning, trying fallback:", err.message);
        return await api.getMaterials({ uploaded_by: facultyId }).catch(() => []);
      });
      setMaterials(data || []);
    } catch (err) {
      console.error("Error fetching faculty history:", err);
      setMaterials([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    // Check token before upload
    const token = getStoredToken();
    if (!token) {
      setUploadError("Session expired or missing auth token. Redirecting to login...");
      setTimeout(() => router.push('/login'), 1200);
      return;
    }

    if (!file) {
      setUploadError("Please select a document file (PDF or text file) to upload.");
      return;
    }

    setUploadError(null);
    setUploadMessage(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      if (description) formData.append("description", description);
      formData.append("subject_id", subjectId);
      formData.append("semester", semester);
      formData.append("unit", unit);
      formData.append("material_type", materialType);
      formData.append("faculty_id", facultyId);
      formData.append("file", file);

      await api.uploadMaterial(formData);
      
      setUploadMessage("Material uploaded successfully! Document has been indexed for RAG vector search.");
      setTitle('');
      setDescription('');
      setFile(null);
      
      // Refresh history table
      fetchFacultyHistory();
    } catch (err) {
      console.error("Upload handler caught error:", err);
      setUploadError(err.message || "Material upload failed. Please verify backend service connectivity.");
    } finally {
      setUploading(false);
    }
  };

  const handleArchive = async (id) => {
    const token = getStoredToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setActionLoading(prev => ({ ...prev, [id]: 'archive' }));
    try {
      await api.archiveMaterial(id);
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, status: 'archived' } : m));
    } catch (err) {
      console.error("Archive error:", err);
      alert("Failed to archive material: " + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleDelete = async (id) => {
    const token = getStoredToken();
    if (!token) {
      router.push('/login');
      return;
    }

    if (!confirm("Are you sure you want to delete this material? This will purge the file, database entry, and vector chunks.")) {
      return;
    }

    setActionLoading(prev => ({ ...prev, [id]: 'delete' }));
    try {
      await api.deleteMaterial(id);
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete material: " + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Profile Section */}
      <div className="glass-card p-6 rounded-2xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xl shadow-lg">
            <User className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{user?.name || "Dr. Faculty Administrator"}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{user?.email || "dr.smith@academic.edu"} • Department of Computer Science</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-xl font-extrabold text-white">{materials.length}</div>
            <div className="text-[11px] text-gray-400 uppercase tracking-wider">Uploaded Materials</div>
          </div>
          <button
            onClick={fetchFacultyHistory}
            className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 transition-all"
            title="Refresh Table"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Upload Component & History Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-gray-800 space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-gray-800">
            <UploadCloud className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white">Upload Faculty Material</h2>
          </div>

          {uploadMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{uploadMessage}</span>
            </div>
          )}

          {uploadError && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Document Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Operating Systems - Unit 2 Memory Management"
                required
                className="w-full px-3.5 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of covered concepts..."
                rows={2}
                className="w-full px-3.5 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  {[1, 2, 3, 4, 5].map(u => (
                    <option key={u} value={u}>Unit {u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Material Type</label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="notes">Lecture Notes</option>
                <option value="reference">Reference Guide</option>
                <option value="syllabus">Syllabus & Blueprint</option>
                <option value="assignment">Assignment & Tutorial</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Upload Document File (PDF) *</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files[0] || null)}
                required
                className="w-full px-3 py-2 bg-gray-900/90 border border-gray-700/80 rounded-xl text-xs text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/25 transition-all disabled:opacity-50 mt-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Parsing OCR & Ingesting RAG...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload & Process Document</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* History Table */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-gray-800 space-y-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">Uploaded Materials History</h2>
            </div>
            <span className="text-xs text-gray-400 font-mono">{materials.length} Items</span>
          </div>

          {loadingHistory ? (
            <div className="py-20 flex justify-center items-center space-x-3">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-gray-400">Loading uploaded materials...</span>
            </div>
          ) : materials.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-gray-800 rounded-xl">
              <BookOpen className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-white">No materials uploaded yet</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1">
                Upload your course lecture notes or syllabus above to populate this history table.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-900/80 text-gray-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Material</th>
                    <th className="px-3 py-3">Sem / Unit</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {materials.map((mat) => (
                    <tr key={mat.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-semibold text-white line-clamp-1">{mat.title}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{mat.subject_name || 'Computer Science'} • {mat.material_type}</div>
                      </td>
                      <td className="px-3 py-3.5 font-mono text-[11px]">
                        Sem {mat.semester} {mat.unit ? `(U${mat.unit})` : ''}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          mat.status === 'archived'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {mat.status || 'active'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {mat.file_url && (
                            <a
                              href={mat.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                              title="View / Open Document"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {mat.file_url && (
                            <a
                              href={mat.file_url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                              title="Download Document"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            onClick={() => handleArchive(mat.id)}
                            disabled={actionLoading[mat.id] === 'archive' || mat.status === 'archived'}
                            className="p-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 transition-colors disabled:opacity-40"
                            title="Archive Material"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(mat.id)}
                            disabled={actionLoading[mat.id] === 'delete'}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors disabled:opacity-40"
                            title="Delete Material"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
