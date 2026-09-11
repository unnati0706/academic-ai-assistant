'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Download, Eye, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { getDocumentUrl } from '@/lib/supabase';
import PdfViewerModal from '@/components/PdfViewerModal';

export default function QuestionPapersPage() {
  const [examType, setExamType] = useState('');
  const [year, setYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  // PDF Viewer Modal State
  const [activePdf, setActivePdf] = useState(null);

  const handleOpenPdf = (paper) => {
    const rawUrl = paper.file_url || paper.file_path;
    const resolvedUrl = getDocumentUrl(rawUrl, 'academic-documents', paper.id);
    setActivePdf({
      url: resolvedUrl,
      title: `${paper.title} (${paper.year || ''})`
    });
  };

  const handleDownload = (fileUrl, title) => {
    if (!fileUrl) return;
    const resolvedUrl = getDocumentUrl(fileUrl, 'academic-documents');
    const a = document.createElement('a');
    a.href = resolvedUrl;
    a.download = `${title || 'question_paper'}.pdf`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    async function fetchPapers() {
      setLoading(true);
      try {
        const params = {};
        if (examType) params.exam_type = examType;
        if (year) params.year = parseInt(year);
        if (searchQuery) params.search = searchQuery;

        const res = await api.getQuestionPapers(params).catch(() => []);
        setPapers(res || []);
      } catch (err) {
        console.error("Fetch papers error:", err);
        setPapers([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPapers();
  }, [examType, year, searchQuery]);

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">University Question Paper Archive</h1>
          <p className="text-xs text-gray-400 mt-1">Previous years mid-semester & end-semester university exam papers.</p>
        </div>

        <div className="inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 self-start sm:self-auto">
          <FileText className="w-4 h-4 text-purple-400" />
          <span>{papers.length} Papers Archived</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-3">
        {/* Search */}
        <div className="sm:col-span-2 lg:col-span-6 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search paper title, subject code..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Exam Type */}
        <div className="lg:col-span-4">
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">All Exam Types</option>
            <option value="mid-sem">Mid-Semester Exam</option>
            <option value="university">University End-Sem</option>
          </select>
        </div>

        {/* Year */}
        <div className="lg:col-span-2">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">All Years</option>
            {[2026, 2025, 2024, 2023, 2022].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Question Papers Cards Grid */}
      {loading ? (
        <div className="py-20 flex justify-center items-center space-x-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-400 font-medium">Loading question papers...</span>
        </div>
      ) : papers.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 sm:p-12 text-center border border-gray-800">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No question papers found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or year selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {papers.map((paper) => (
            <div
              key={paper.id}
              className="glass-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4 border border-gray-800 hover:border-purple-500/40 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {paper.exam_type === 'mid-sem' ? 'Mid-Semester' : 'University End-Sem'}
                  </span>
                  {paper.year && (
                    <div className="flex items-center space-x-1 text-[11px] text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded-md border border-gray-700/50">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>{paper.year}</span>
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
                  {paper.title}
                </h3>
                <p className="text-[11px] text-indigo-400 font-medium mt-1">{paper.subject_name || paper.subject_code || 'Computer Science'}</p>
              </div>

              <div className="pt-3.5 border-t border-gray-800/80 flex items-center space-x-2">
                {(paper.file_url || paper.file_path || paper.id) && (
                  <button
                    type="button"
                    onClick={() => handleOpenPdf(paper)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all active:scale-[0.98]"
                  >
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span>View PDF</span>
                  </button>
                )}

                {(paper.file_url || paper.file_path || paper.id) && (
                  <button
                    type="button"
                    onClick={() => handleDownload(paper.file_url || paper.file_path, paper.title)}
                    className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    title="Download Paper PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
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
