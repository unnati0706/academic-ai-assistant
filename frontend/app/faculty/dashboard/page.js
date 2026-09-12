'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, Trash2, Archive, ExternalLink, Download, CheckCircle2, AlertCircle, User, BookOpen, Pencil, X, ChevronDown, ChevronRight } from 'lucide-react';
import { getStoredUser, getStoredToken } from '@/lib/auth';
import { api } from '@/lib/api';
import { getDocumentUrl } from '@/lib/supabase';

// ─── Edit Profile Modal ────────────────────────────────────────────────────────
function EditProfileModal({ user, currentProfile, onSave, onClose }) {
  const [name, setName] = useState(currentProfile?.name || user?.name || '');
  const [department, setDepartment] = useState(currentProfile?.department || '');
  const [designation, setDesignation] = useState(currentProfile?.designation || '');
  const [bio, setBio] = useState(currentProfile?.bio || '');
  const [saving, setSaving] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    const profile = {
      id: user?.id || user?.email,
      email: user?.email,
      name: name.trim() || user?.name,
      department: department.trim(),
      designation: designation.trim(),
      bio: bio.trim(),
    };

    // Persist to localStorage under faculty_profiles array
    try {
      const stored = localStorage.getItem('faculty_profiles');
      const profiles = stored ? JSON.parse(stored) : [];
      const existingIdx = profiles.findIndex(p => p.email === profile.email || p.id === profile.id);
      if (existingIdx >= 0) {
        profiles[existingIdx] = profile;
      } else {
        profiles.push(profile);
      }
      localStorage.setItem('faculty_profiles', JSON.stringify(profiles));
    } catch (_) {}

    setTimeout(() => {
      setSaving(false);
      onSave(profile);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#1e2c29] border border-[#2e433e] rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#4f7c6e]/20 border border-[#4f7c6e]/30 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-[#5ea891]" />
            </div>
            <h2 className="text-sm font-bold text-[#f4f1ea]">Edit Faculty Profile</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#8fb1a5] hover:text-[#f4f1ea] hover:bg-[#2e433e] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#c8ded7] mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Dr. Anita Sharma"
              className="w-full px-3.5 py-2.5 bg-[#151f1d] border border-[#2e433e] rounded-xl text-xs text-[#f4f1ea] placeholder-[#8fb1a5]/50 focus:outline-none focus:border-[#4f7c6e] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#c8ded7] mb-1.5">Department</label>
            <input
              type="text"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science & Engineering"
              className="w-full px-3.5 py-2.5 bg-[#151f1d] border border-[#2e433e] rounded-xl text-xs text-[#f4f1ea] placeholder-[#8fb1a5]/50 focus:outline-none focus:border-[#4f7c6e] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#c8ded7] mb-1.5">Designation / Title</label>
            <input
              type="text"
              value={designation}
              onChange={e => setDesignation(e.target.value)}
              placeholder="e.g. Associate Professor"
              className="w-full px-3.5 py-2.5 bg-[#151f1d] border border-[#2e433e] rounded-xl text-xs text-[#f4f1ea] placeholder-[#8fb1a5]/50 focus:outline-none focus:border-[#4f7c6e] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#c8ded7] mb-1.5">Short Bio / Office Info</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Brief background, research interests, or office location..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-[#151f1d] border border-[#2e433e] rounded-xl text-xs text-[#f4f1ea] placeholder-[#8fb1a5]/50 focus:outline-none focus:border-[#4f7c6e] transition-all resize-none"
            />
          </div>

          <div className="flex space-x-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#151f1d] hover:bg-[#2e433e] border border-[#2e433e] text-[#8fb1a5] text-xs font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl gradient-bg hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-[#4f7c6e]/20 transition-all disabled:opacity-60 flex items-center justify-center space-x-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Semester Group Accordion ──────────────────────────────────────────────────
function SemesterGroup({ semester, items, onArchive, onDelete, actionLoading }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-[#2e433e] rounded-xl overflow-hidden">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#1e2c29] hover:bg-[#2e433e] transition-colors text-left"
      >
        <div className="flex items-center space-x-2.5">
          {open ? (
            <ChevronDown className="w-4 h-4 text-[#5ea891]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#5ea891]" />
          )}
          <span className="text-xs font-bold text-[#f4f1ea]">Semester {semester}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4f7c6e]/20 text-[#8fb1a5] border border-[#4f7c6e]/25">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </button>

      {/* Accordion Body */}
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#c8ded7]">
            <thead className="bg-[#151f1d] text-[#8fb1a5] uppercase text-[10px] font-bold">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Material</th>
                <th className="px-3 py-3">Unit</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-4 py-3 text-right rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2e433e]/60">
              {items.map((mat) => (
                <tr key={mat.id} className="hover:bg-[#2e433e]/30 transition-colors">
                  <td className="px-4 py-3.5 max-w-xs">
                    <div className="font-semibold text-[#f4f1ea] line-clamp-1">{mat.title}</div>
                    <div className="text-[10px] text-[#8fb1a5] mt-0.5">{mat.subject_name || 'Computer Science'} • {mat.material_type}</div>
                  </td>
                  <td className="px-3 py-3.5 font-mono text-[11px] text-[#8fb1a5]">
                    {mat.unit ? `Unit ${mat.unit}` : '—'}
                  </td>
                  <td className="px-3 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      (mat.status || '').toUpperCase() === 'ARCHIVED'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-[#4f7c6e]/20 text-[#5ea891] border border-[#4f7c6e]/30'
                    }`}>
                      {(mat.status || 'ACTIVE').toUpperCase() === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {mat.file_url && (
                        <a
                          href={mat.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-[#1e2c29] hover:bg-[#2e433e] text-[#8fb1a5] border border-[#2e433e] transition-colors"
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
                          className="p-1.5 rounded-lg bg-[#1e2c29] hover:bg-[#2e433e] text-[#8fb1a5] border border-[#2e433e] transition-colors"
                          title="Download Document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        onClick={() => onArchive(mat.id)}
                        disabled={actionLoading[mat.id] === 'archive'}
                        className={`p-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                          (mat.status || '').toUpperCase() === 'ARCHIVED'
                            ? 'bg-[#4f7c6e]/10 hover:bg-[#4f7c6e]/20 text-[#5ea891] border-[#4f7c6e]/30'
                            : 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        }`}
                        title={(mat.status || '').toUpperCase() === 'ARCHIVED' ? "Restore / Unarchive Material" : "Archive Material"}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDelete(mat.id)}
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
  );
}

// ─── Main Faculty Dashboard ────────────────────────────────────────────────────
export default function FacultyDashboard() {
  const router = useRouter();
  const user = getStoredUser();
  const facultyId = user?.id || "00000000-0000-0000-0000-000000000002";

  // Profile state
  const [profileData, setProfileData] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Upload Form State
  const fileInputRef = useRef(null);
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
    // Load saved faculty profile from localStorage
    try {
      const stored = localStorage.getItem('faculty_profiles');
      if (stored) {
        const profiles = JSON.parse(stored);
        const mine = profiles.find(p => p.email === user?.email || p.id === user?.id);
        if (mine) setProfileData(mine);
      }
    } catch (_) {}

    // Guard check
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('token') ||
          localStorage.getItem('access_token') ||
          localStorage.getItem('academic_ai_token') ||
          getStoredToken()
        : null;

    if (!token) {
      console.warn("Faculty Dashboard: No auth token found. Redirecting to /login.");
      router.push('/login');
      return;
    }
    fetchFacultyHistory();
  }, [router]);

  async function fetchFacultyHistory() {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('token') ||
          localStorage.getItem('access_token') ||
          localStorage.getItem('academic_ai_token') ||
          getStoredToken()
        : null;

    if (!token) {
      router.push('/login');
      return;
    }

    setLoadingHistory(true);
    try {
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

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('token') ||
          localStorage.getItem('access_token') ||
          localStorage.getItem('academic_ai_token') ||
          getStoredToken()
        : null;

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
      formData.append("title", title.trim());
      if (description) formData.append("description", description.trim());
      formData.append("semester", semester);
      formData.append("unit", unit);
      formData.append("material_type", materialType);
      if (subjectId) formData.append("subject_id", subjectId);
      if (facultyId) formData.append("faculty_id", facultyId);
      formData.append("file", file);

      const res = await api.uploadMaterial(formData);

      // Prepend the new document to the materials list immediately
      if (res) {
        setMaterials(prev => [res, ...prev.filter(m => m.id !== res.id)]);
      }

      setUploadMessage("Material uploaded successfully! Document has been indexed for RAG vector search.");
      setTitle('');
      setDescription('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Re-fetch faculty history in background for database synchronization
      fetchFacultyHistory();
    } catch (err) {
      console.error("Upload handler caught error:", err);
      const errorMessage =
        err?.response?.data?.detail ||
        err?.detail ||
        err?.message ||
        (typeof err === 'object' ? JSON.stringify(err) : String(err));
      setUploadError(errorMessage || "Material upload failed. Please verify backend service connectivity.");
    } finally {
      setUploading(false);
    }
  };

  const handleArchive = async (id) => {
    const token = getStoredToken();
    if (!token) { router.push('/login'); return; }

    setActionLoading(prev => ({ ...prev, [id]: 'archive' }));
    try {
      const res = await api.archiveMaterial(id);
      const returnedStatus = res?.status || 'ARCHIVED';
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, status: returnedStatus } : m));
    } catch (err) {
      console.error("Archive error:", err);
      alert("Failed to update material status: " + err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleDelete = async (id) => {
    const token = getStoredToken();
    if (!token) { router.push('/login'); return; }

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

  // Group materials by semester
  const materialsBySemester = materials.reduce((acc, mat) => {
    const sem = mat.semester || 'Uncategorised';
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(mat);
    return acc;
  }, {});

  const semesterKeys = Object.keys(materialsBySemester).sort((a, b) => {
    if (a === 'Uncategorised') return 1;
    if (b === 'Uncategorised') return -1;
    return Number(a) - Number(b);
  });

  const displayName = profileData?.name || user?.name || "Dr. Faculty Administrator";
  const displayDept = profileData?.department || "Department of Computer Science";

  return (
    <div className="space-y-8">
      {/* Header Profile Section */}
      <div className="glass-card p-6 rounded-2xl border border-[#2e433e] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#4f7c6e]/20">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#f4f1ea] tracking-tight">{displayName}</h1>
            <p className="text-xs text-[#8fb1a5] mt-0.5">
              {user?.email || "dr.smith@academic.edu"} • {displayDept}
            </p>
            {profileData?.designation && (
              <p className="text-[11px] text-[#5ea891] font-medium mt-0.5">{profileData.designation}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-xl font-extrabold text-[#f4f1ea]">{materials.length}</div>
            <div className="text-[11px] text-[#8fb1a5] uppercase tracking-wider">Uploaded Materials</div>
          </div>
          <button
            onClick={() => setShowEditProfile(true)}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-[#4f7c6e]/15 hover:bg-[#4f7c6e]/25 border border-[#4f7c6e]/30 text-[#8fb1a5] hover:text-[#c8ded7] text-xs font-semibold transition-all"
            title="Edit Faculty Profile"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Upload + History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload Form */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-[#2e433e] space-y-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-[#2e433e]">
            <UploadCloud className="w-5 h-5 text-[#5ea891]" />
            <h2 className="text-base font-bold text-[#f4f1ea]">Upload Faculty Material</h2>
          </div>

          {uploadMessage && (
            <div className="p-3.5 rounded-xl bg-[#4f7c6e]/10 border border-[#4f7c6e]/25 text-[#5ea891] text-xs flex items-center space-x-2">
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
              <label className="block text-xs font-semibold text-[#c8ded7] mb-1">Document Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Operating Systems - Unit 2 Memory Management"
                required
                className="w-full px-3.5 py-2.5 bg-[#151f1d] border border-[#2e433e] rounded-xl text-xs text-[#f4f1ea] placeholder-[#8fb1a5]/50 focus:outline-none focus:border-[#4f7c6e] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#c8ded7] mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of covered concepts..."
                rows={2}
                className="w-full px-3.5 py-2.5 bg-[#151f1d] border border-[#2e433e] rounded-xl text-xs text-[#f4f1ea] placeholder-[#8fb1a5]/50 focus:outline-none focus:border-[#4f7c6e] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#c8ded7] mb-1">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#151f1d] border border-[#2e433e] rounded-xl text-xs text-[#f4f1ea] focus:outline-none focus:border-[#4f7c6e]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#c8ded7] mb-1">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#151f1d] border border-[#2e433e] rounded-xl text-xs text-[#f4f1ea] focus:outline-none focus:border-[#4f7c6e]"
                >
                  {[1, 2, 3, 4, 5].map(u => (
                    <option key={u} value={u}>Unit {u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#c8ded7] mb-1">Material Type</label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#151f1d] border border-[#2e433e] rounded-xl text-xs text-[#f4f1ea] focus:outline-none focus:border-[#4f7c6e]"
              >
                <option value="notes">Lecture Notes</option>
                <option value="question_paper">Question Paper</option>
                <option value="assignment">Assignment & Tutorial</option>
                <option value="reference">Reference Guide</option>
                <option value="syllabus">Syllabus & Blueprint</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#c8ded7] mb-1">Upload Document File (PDF) *</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files[0] || null)}
                required
                className="w-full px-3 py-2 bg-[#151f1d] border border-[#2e433e] rounded-xl text-xs text-[#8fb1a5] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#4f7c6e] file:text-white hover:file:bg-[#5ea891] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3 px-4 rounded-xl gradient-bg hover:opacity-90 text-white font-medium text-xs flex items-center justify-center space-x-2 shadow-lg shadow-[#4f7c6e]/25 transition-all disabled:opacity-50 mt-2"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* History — Semester-wise Grouped */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-[#2e433e] space-y-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#2e433e]">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-[#5ea891]" />
              <h2 className="text-base font-bold text-[#f4f1ea]">Uploaded Materials History</h2>
            </div>
            <span className="text-xs text-[#8fb1a5] font-mono">{materials.length} Items</span>
          </div>

          {loadingHistory ? (
            <div className="py-20 flex justify-center items-center space-x-3">
              <div className="w-6 h-6 border-2 border-[#4f7c6e] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-[#8fb1a5]">Loading uploaded materials...</span>
            </div>
          ) : materials.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[#2e433e] rounded-xl">
              <BookOpen className="w-10 h-10 text-[#4f7c6e]/30 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-[#f4f1ea]">No materials uploaded yet</h4>
              <p className="text-xs text-[#8fb1a5] max-w-xs mx-auto mt-1">
                Upload your course lecture notes or syllabus above to populate this history table.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {semesterKeys.map(sem => (
                <SemesterGroup
                  key={sem}
                  semester={sem}
                  items={materialsBySemester[sem]}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal
          user={user}
          currentProfile={profileData}
          onSave={(profile) => {
            setProfileData(profile);
            setShowEditProfile(false);
          }}
          onClose={() => setShowEditProfile(false)}
        />
      )}
    </div>
  );
}
