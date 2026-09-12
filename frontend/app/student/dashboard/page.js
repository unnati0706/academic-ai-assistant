'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, FileText, ArrowRight, Download, Eye, Users, GraduationCap, Briefcase } from 'lucide-react';
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
    // Load faculty profiles from localStorage (persisted by faculty Edit Profile)
    try {
      const stored = localStorage.getItem('faculty_profiles');
      if (stored) {
        setFacultyProfiles(JSON.parse(stored));
      }
    } catch (_) {}

    async function loadData() {
      try {
        const [matRes, papersRes] = await Promise.all([
          api.getMaterials().catch(() => []),
          api.getQuestionPapers().catch(() => [])
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
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">

      {/* Faculty Profiles Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4f7c6e]/20 border border-[#4f7c6e]/30 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#5ea891]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#f4f1ea] tracking-tight">Faculty Profiles & Department Leads</h1>
              <p className="text-[11px] text-[#8fb1a5] mt-0.5">Your course instructors and department faculty</p>
            </div>
          </div>
          <span className="text-xs text-[#8fb1a5] font-medium">{facultyProfiles.length} Faculty</span>
        </div>

        {facultyProfiles.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 sm:p-10 text-center border border-[#2e433e]">
            <div className="w-14 h-14 rounded-2xl bg-[#4f7c6e]/10 border border-[#4f7c6e]/20 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-7 h-7 text-[#8fb1a5]" />
            </div>
            <h3 className="text-sm font-bold text-[#f4f1ea]">No Faculty Profiles Yet</h3>
            <p className="text-xs text-[#8fb1a5] mt-1.5 max-w-sm mx-auto leading-relaxed">
              Faculty profiles will appear here once instructors complete their department profile setup.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {facultyProfiles.map((faculty, idx) => (
              <div
                key={faculty.id || faculty.email || idx}
                className="glass-card rounded-2xl p-5 border border-[#2e433e] hover:border-[#4f7c6e]/40 transition-all group"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4f7c6e] to-[#3d6459] flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#4f7c6e]/20 shrink-0">
                    {faculty.name ? faculty.name.charAt(0).toUpperCase() : 'F'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#f4f1ea] truncate group-hover:text-[#c8ded7] transition-colors">
                      {faculty.name || 'Faculty Member'}
                    </h4>
                    {faculty.designation && (
                      <p className="text-[10px] text-[#5ea891] font-medium truncate">{faculty.designation}</p>
                    )}
                  </div>
                </div>
                {faculty.department && (
                  <div className="flex items-center space-x-1.5 mb-2">
                    <Briefcase className="w-3 h-3 text-[#8fb1a5] shrink-0" />
                    <span className="text-[11px] text-[#8fb1a5] truncate">{faculty.department}</span>
                  </div>
                )}
                {faculty.bio && (
                  <p className="text-[11px] text-[#8fb1a5]/80 leading-relaxed line-clamp-2 mt-1">
                    {faculty.bio}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5 max-w-xl">
        <div className="glass-card p-4 sm:p-5 rounded-2xl flex items-center space-x-4 border border-[#2e433e]">
          <div className="w-12 h-12 rounded-xl bg-[#4f7c6e]/10 border border-[#4f7c6e]/20 flex items-center justify-center text-[#5ea891] shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#8fb1a5] font-medium">Study Materials</div>
            <div className="text-xl font-bold text-[#f4f1ea] mt-0.5">{materials.length}</div>
          </div>
        </div>

        <div className="glass-card p-4 sm:p-5 rounded-2xl flex items-center space-x-4 border border-[#2e433e]">
          <div className="w-12 h-12 rounded-xl bg-[#4f7c6e]/10 border border-[#4f7c6e]/20 flex items-center justify-center text-[#5ea891] shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#8fb1a5] font-medium">Question Papers</div>
            <div className="text-xl font-bold text-[#f4f1ea] mt-0.5">{loading ? '—' : `${papers.length} Papers`}</div>
          </div>
        </div>
      </div>

      {/* Recent Course Materials — Full Width */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-[#5ea891]" />
            <h3 className="text-base font-bold text-[#f4f1ea]">Recent Course Materials</h3>
          </div>
          <Link href="/student/materials" className="text-xs font-semibold text-[#5ea891] hover:text-[#8fb1a5] transition-colors">
            View All →
          </Link>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#8fb1a5]">Loading course materials...</div>
          ) : materials.length === 0 ? (
            <div className="glass-card p-6 rounded-xl text-center text-xs text-[#8fb1a5] border border-[#2e433e]">
              No uploaded faculty materials yet. Materials will appear here once uploaded by faculty.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {materials.slice(0, 6).map((mat) => (
                <div key={mat.id} className="glass-card p-4 rounded-xl flex items-center justify-between gap-3 border border-[#2e433e] hover:border-[#4f7c6e]/40 transition-all">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#4f7c6e]/20 text-[#8fb1a5] uppercase border border-[#4f7c6e]/25">
                        {mat.material_type || 'PDF'}
                      </span>
                      {mat.semester && (
                        <span className="text-[10px] text-[#8fb1a5]">Sem {mat.semester}</span>
                      )}
                      {mat.unit && (
                        <span className="text-[10px] text-[#8fb1a5] hidden sm:inline">• Unit {mat.unit}</span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-[#f4f1ea] truncate">{mat.title}</h4>
                    <p className="text-[11px] text-[#8fb1a5] mt-0.5 truncate">{mat.subject_name || 'Computer Science'}</p>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {(mat.file_url || mat.file_path) && (
                      <button
                        type="button"
                        onClick={() => handleOpenPdf(mat)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#4f7c6e]/20 hover:bg-[#4f7c6e]/30 text-[#8fb1a5] transition-colors flex items-center space-x-1 text-xs font-medium"
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
                        className="p-1.5 rounded-lg bg-[#1e2c29] hover:bg-[#2e433e] text-[#8fb1a5] transition-colors border border-[#2e433e]"
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
