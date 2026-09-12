'use client';

import { useState, useEffect } from 'react';
import { Search, BookOpen, Download, ExternalLink, User, Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { getDocumentUrl } from '@/lib/supabase';
import PdfViewerModal from '@/components/PdfViewerModal';

export default function MaterialsPage() {
  const [semester, setSemester] = useState('');
  const [unit, setUnit] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // PDF Viewer Modal State
  const [activePdf, setActivePdf] = useState(null); // { url, title }

  const handleOpenPdf = (mat) => {
    const rawUrl = mat.file_url || mat.file_path;
    const resolvedUrl = getDocumentUrl(rawUrl, 'academic-documents', mat.id);
    setActivePdf({
      url: resolvedUrl,
      title: mat.title
    });
  };

  const handleDownload = (fileUrl, title) => {
    if (!fileUrl) return;
    const resolvedUrl = getDocumentUrl(fileUrl, 'academic-documents');
    const a = document.createElement('a');
    a.href = resolvedUrl;
    a.download = `${title || 'document'}.pdf`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    async function fetchMaterials() {
      setLoading(true);
      try {
        const params = {};
        if (semester) params.semester = semester;
        if (unit) params.unit = unit;
        if (typeFilter) params.material_type = typeFilter;
        if (searchQuery) params.search = searchQuery;

        const res = await api.getMaterials(params).catch(() => []);
        setMaterials(res || []);
      } catch (err) {
        console.error("Fetch materials error:", err);
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMaterials();
  }, [semester, unit, typeFilter, searchQuery]);

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto text-[#263339]">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#263339] tracking-tight">Academic Resource Explorer</h1>
          <p className="text-xs text-[#465F64] mt-0.5">Browse course notes, syllabus, and lecture materials</p>
        </div>

        <div className="inline-flex items-center space-x-2 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#E6D9B9] text-[#263339] border border-[#D8D6C9] self-start sm:self-auto">
          <BookOpen className="w-4 h-4 text-[#749190]" />
          <span>{materials.length} Materials Available</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#D8D6C9] shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3">
        {/* Search Input */}
        <div className="sm:col-span-2 lg:col-span-4 relative">
          <Search className="w-4 h-4 text-[#465F64] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, unit, subject..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D8D6C9] rounded-xl text-xs text-[#263339] placeholder-[#465F64]/50 focus:outline-none focus:border-[#749190] focus:ring-1 focus:ring-[#749190] transition-all"
          />
        </div>

        {/* Semester Filter */}
        <div className="lg:col-span-3">
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-[#D8D6C9] rounded-xl text-xs text-[#263339] focus:outline-none focus:border-[#749190] transition-all font-medium"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>

        {/* Unit Selector */}
        <div className="lg:col-span-3">
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-[#D8D6C9] rounded-xl text-xs text-[#263339] focus:outline-none focus:border-[#749190] transition-all font-medium"
          >
            <option value="">All Units</option>
            {[1, 2, 3, 4, 5].map(u => (
              <option key={u} value={u}>Unit {u}</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="lg:col-span-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-[#D8D6C9] rounded-xl text-xs text-[#263339] focus:outline-none focus:border-[#749190] transition-all font-medium"
          >
            <option value="">All Types</option>
            <option value="notes">Notes</option>
            <option value="reference">Reference</option>
            <option value="syllabus">Syllabus</option>
            <option value="assignment">Assignment</option>
            <option value="question_paper">Question Paper</option>
          </select>
        </div>
      </div>

      {/* Resource Card Grid */}
      {loading ? (
        <div className="py-20 flex justify-center items-center space-x-3">
          <div className="w-8 h-8 border-4 border-[#749190] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-[#465F64] font-semibold">Fetching study materials...</span>
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 sm:p-12 text-center border border-[#D8D6C9] shadow-xs">
          <BookOpen className="w-12 h-12 text-[#749190]/40 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#263339]">No uploaded materials found</h3>
          <p className="text-xs text-[#465F64] mt-1 max-w-sm mx-auto">
            Materials will appear here when uploaded by faculty members.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 border border-[#D8D6C9] hover:border-[#749190] hover:shadow-md transition-all group"
            >
              <div>
                {/* Header badges */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-[#E6D9B9] text-[#263339] border border-[#D8D6C9]">
                    {mat.material_type || 'PDF'}
                  </span>
                  {mat.unit && (
                    <span className="text-[11px] font-semibold text-[#465F64] bg-[#fbf9f5] px-2 py-0.5 rounded-md border border-[#D8D6C9]">
                      Unit {mat.unit}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-[#263339] group-hover:text-[#749190] transition-colors line-clamp-2 leading-snug">
                  {mat.title}
                </h3>
                <p className="text-[11px] text-[#749190] font-bold mt-1">{mat.subject_name || mat.subject_code || 'Computer Science'}</p>

                {mat.uploader && (
                  <div className="flex items-center space-x-1.5 text-[11px] text-[#465F64] mt-2 font-medium">
                    <User className="w-3 h-3 text-[#749190]" />
                    <span>Uploaded by: {mat.uploader.email || 'Faculty'}</span>
                  </div>
                )}

                <p className="text-xs text-[#465F64] mt-2 line-clamp-3 leading-relaxed">
                  {mat.description || 'Verified course document.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3.5 border-t border-[#D8D6C9] flex items-center space-x-2">
                {(mat.file_url || mat.file_path || mat.id) && (
                  <button
                    type="button"
                    onClick={() => handleOpenPdf(mat)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#749190]/15 hover:bg-[#749190]/25 border border-[#749190]/30 text-[#749190] text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-[0.98]"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#749190]" />
                    <span>View PDF</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDownload(mat.file_url || mat.file_path, mat.title)}
                  className="p-2.5 rounded-xl bg-[#fbf9f5] hover:bg-[#D8D6C9]/40 text-[#465F64] hover:text-[#263339] transition-colors border border-[#D8D6C9]"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
