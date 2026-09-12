'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, FileText, ArrowRight, Download, Eye, Users, GraduationCap, Briefcase, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import { getDocumentUrl } from '@/lib/supabase';
import PdfViewerModal from '@/components/PdfViewerModal';

export default function StudentDashboard() {
  const [materials, setMaterials] = useState([]);
  const [papers, setPapers] = useState([]);
  const [facultyProfiles, setFacultyProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // PDF Viewer Modal State
  const [activePdf, setActivePdf] = useState(null);

  const handleOpenPdf = (mat) => {
    const rawUrl = mat.file_url || mat.file_path;
    const resolvedUrl = getDocumentUrl(rawUrl, 'academic-documents', mat.id);
    setActivePdf({
      url: resolvedUrl,
      title: mat.title
    });
  };

  const handleDownload = (fileUrl, fileName) => {
    if (!fileUrl) return;
    const resolvedUrl = getDocumentUrl(fileUrl, 'academic-documents');
    const a = document.createElement('a');
    a.href = resolvedUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = `${fileName || 'document'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    // Load faculty profiles from localStorage and provide default fallback if none
    const loadFacultyProfiles = () => {
      try {
        let list = [];
        const storedProfiles = localStorage.getItem('faculty_profiles');
        const singleProfile = localStorage.getItem('faculty_profile');

        if (storedProfiles) {
          try { list = JSON.parse(storedProfiles); } catch (_) {}
        }
        if ((!list || list.length === 0) && singleProfile) {
          try { list = [JSON.parse(singleProfile)]; } catch (_) {}
        }
        if (!list || list.length === 0) {
          list = [
            {
              id: "00000000-0000-0000-0000-000000000002",
              name: "Dr. Robert Smith",
              email: "dr.smith@academic.edu",
              department: "Department of Computer Science",
              designation: "Associate Professor & Department Head",
              bio: "Specializing in Distributed Systems, Artificial Intelligence, and Data Structures."
            }
          ];
        }
        setFacultyProfiles(list);
      } catch (_) {}
    };

    loadFacultyProfiles();
    window.addEventListener('faculty_profile_updated', loadFacultyProfiles);
    window.addEventListener('storage', loadFacultyProfiles);
    window.addEventListener('user-updated', loadFacultyProfiles);

    async function loadData() {
      try {
        const [matRes, papersRes] = await Promise.all([
          api.getMaterials().catch(() => []),
          (api.getQuestionPapers ? api.getQuestionPapers() : api.getPapers()).catch(() => [])
        ]);
        setMaterials(matRes || []);
        setPapers(papersRes || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    return () => {
      window.removeEventListener('faculty_profile_updated', loadFacultyProfiles);
      window.removeEventListener('storage', loadFacultyProfiles);
      window.removeEventListener('user-updated', loadFacultyProfiles);
    };
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto text-[#263339]">

      {/* Faculty Profiles & Department Leads — Sleek Rectangular Container */}
      <div className="bg-white border border-[#D8D6C9] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#D8D6C9]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#749190]/15 border border-[#749190]/30 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#749190]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#263339] tracking-tight">Faculty Profiles & Department Leads</h2>
              <p className="text-xs text-[#465F64] mt-0.5">Your course instructors and department faculty</p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#E6D9B9] text-[#263339] border border-[#D8D6C9]">
            {facultyProfiles.length} {facultyProfiles.length === 1 ? 'Faculty Lead' : 'Faculty Leads'}
          </span>
        </div>

        {facultyProfiles.length === 0 ? (
          <div className="rounded-xl p-8 text-center border border-[#D8D6C9] bg-[#fbf9f5]">
            <div className="w-12 h-12 rounded-xl bg-[#749190]/10 border border-[#749190]/20 flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-6 h-6 text-[#749190]" />
            </div>
            <h3 className="text-xs font-bold text-[#263339]">No Faculty Profiles Yet</h3>
            <p className="text-[11px] text-[#465F64] mt-1 max-w-sm mx-auto leading-relaxed">
              Faculty profiles will appear here once instructors complete their department profile setup.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {facultyProfiles.map((faculty, idx) => (
              <div
                key={faculty.id || faculty.email || idx}
                className="bg-white border border-[#D8D6C9] rounded-xl p-5 shadow-xs hover:border-[#749190] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-start space-x-4">
                  {/* Left Avatar Initial Circle */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#749190] to-[#5f7b7a] flex items-center justify-center text-white font-bold text-base shadow-sm shadow-[#749190]/20 shrink-0 border border-[#D8D6C9] mt-0.5">
                    {faculty.name ? faculty.name.charAt(0).toUpperCase() : 'F'}
                  </div>

                  {/* Details Column */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-[#263339] truncate">
                        {faculty.name || 'Dr. Faculty Member'}
                      </h3>
                      {faculty.designation && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E6D9B9] text-[#263339] border border-[#D8D6C9]">
                          {faculty.designation}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-[#465F64]">
                      {faculty.email && (
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <Mail className="w-3.5 h-3.5 text-[#749190] shrink-0" />
                          <span className="text-[#263339] truncate font-mono text-[11px] font-medium">{faculty.email}</span>
                        </div>
                      )}
                      {faculty.department && (
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <Briefcase className="w-3.5 h-3.5 text-[#749190] shrink-0" />
                          <span className="truncate text-[11px] font-medium">{faculty.department}</span>
                        </div>
                      )}
                    </div>

                    {faculty.bio && (
                      <p className="text-xs text-[#465F64] leading-relaxed line-clamp-2 pt-1 border-t border-[#D8D6C9]/60">
                        {faculty.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5 max-w-xl">
        <div className="bg-white p-4 sm:p-5 rounded-2xl flex items-center space-x-4 border border-[#D8D6C9] shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-[#749190]/15 border border-[#749190]/25 flex items-center justify-center text-[#749190] shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#465F64] font-semibold">Study Materials</div>
            <div className="text-xl font-extrabold text-[#263339] mt-0.5">{materials.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl flex items-center space-x-4 border border-[#D8D6C9] shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-[#749190]/15 border border-[#749190]/25 flex items-center justify-center text-[#749190] shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#465F64] font-semibold">Question Papers</div>
            <div className="text-xl font-extrabold text-[#263339] mt-0.5">{loading ? '—' : `${papers.length} Papers`}</div>
          </div>
        </div>
      </div>

      {/* Recent Course Materials — Full Width */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-[#749190]" />
            <h3 className="text-base font-bold text-[#263339]">Recent Course Materials</h3>
          </div>
          <Link href="/student/materials" className="text-xs font-bold text-[#749190] hover:text-[#5f7b7a] transition-colors">
            View All →
          </Link>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#465F64]">Loading course materials...</div>
          ) : materials.length === 0 ? (
            <div className="bg-white p-6 rounded-xl text-center text-xs text-[#465F64] border border-[#D8D6C9]">
              No uploaded faculty materials yet. Materials will appear here once uploaded by faculty.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {materials.slice(0, 6).map((mat) => (
                <div key={mat.id} className="bg-white p-4 rounded-xl flex items-center justify-between gap-3 border border-[#D8D6C9] hover:border-[#749190] hover:shadow-md transition-all">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E6D9B9] text-[#263339] uppercase border border-[#D8D6C9]">
                        {mat.material_type || 'PDF'}
                      </span>
                      {mat.semester && (
                        <span className="text-[10px] text-[#465F64] font-semibold">Sem {mat.semester}</span>
                      )}
                      {mat.unit && (
                        <span className="text-[10px] text-[#465F64] font-semibold hidden sm:inline">• Unit {mat.unit}</span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-[#263339] truncate">{mat.title}</h4>
                    <p className="text-[11px] text-[#465F64] mt-0.5 truncate font-medium">{mat.subject_name || 'Computer Science'}</p>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {(mat.file_url || mat.file_path) && (
                      <button
                        type="button"
                        onClick={() => handleOpenPdf(mat)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#749190]/15 hover:bg-[#749190]/25 text-[#749190] transition-colors flex items-center space-x-1 text-xs font-bold"
                        title="View PDF"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">View</span>
                      </button>
                    )}
                    {(mat.file_url || mat.file_path) && (
                      <button
                        type="button"
                        onClick={() => handleDownload(mat.file_url || mat.file_path, mat.title)}
                        className="p-1.5 rounded-lg bg-[#fbf9f5] hover:bg-[#D8D6C9]/40 text-[#465F64] hover:text-[#263339] transition-colors border border-[#D8D6C9]"
                        title="Download File"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Universal Cross-Device PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={Boolean(activePdf)}
        onClose={() => setActivePdf(null)}
        fileUrl={activePdf?.url}
        title={activePdf?.title}
      />
    </div>
  );
}
