'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, FileText, Download, Sparkles, Calendar, BookOpen } from 'lucide-react';
import { api } from '@/lib/api';

export default function PapersPage() {
  const [semester, setSemester] = useState('5');
  const [examType, setExamType] = useState('');
  const [year, setYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  const mockPapersList = [
    {
      id: 'p1',
      title: 'Data Structures Mid-Semester Question Paper 2025',
      subject_name: 'Data Structures & Algorithms',
      subject_code: 'CS-501',
      exam_type: 'mid-sem',
      year: 2025,
      semester: 5,
      file_url: '#'
    },
    {
      id: 'p2',
      title: 'Operating Systems University End-Sem Examination 2024',
      subject_name: 'Operating Systems',
      subject_code: 'CS-502',
      exam_type: 'university',
      year: 2024,
      semester: 5,
      file_url: '#'
    },
    {
      id: 'p3',
      title: 'Database Management Systems Mid-Term Paper 2024',
      subject_name: 'Database Management Systems',
      subject_code: 'CS-503',
      exam_type: 'mid-sem',
      year: 2024,
      semester: 5,
      file_url: '#'
    },
    {
      id: 'p4',
      title: 'Computer Networks End-Semester Exam 2023',
      subject_name: 'Computer Networks',
      subject_code: 'CS-504',
      exam_type: 'university',
      year: 2023,
      semester: 5,
      file_url: '#'
    }
  ];

  useEffect(() => {
    async function fetchPapers() {
      setLoading(true);
      try {
        const params = {};
        if (semester) params.semester = semester;
        if (examType) params.exam_type = examType;
        if (year) params.year = year;
        if (searchQuery) params.search = searchQuery;

        const res = await api.getPapers(params).catch(() => []);
        if (res && res.length) {
          setPapers(res);
        } else {
          let filtered = mockPapersList;
          if (semester) filtered = filtered.filter(p => String(p.semester) === String(semester));
          if (examType) filtered = filtered.filter(p => p.exam_type === examType);
          if (year) filtered = filtered.filter(p => String(p.year) === String(year));
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.subject_name.toLowerCase().includes(q));
          }
          setPapers(filtered);
        }
      } catch (err) {
        console.error("Fetch papers error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPapers();
  }, [semester, examType, year, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Question Paper Archives</h1>
          <p className="text-xs text-gray-400 mt-1">Previous years' mid-term and university end-semester examination papers.</p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20">
          <FileText className="w-4 h-4 text-purple-400" />
          <span>{papers.length} Papers Found</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Search */}
        <div className="lg:col-span-4 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search paper title or subject..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Semester */}
        <div className="lg:col-span-3">
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>

        {/* Exam Type */}
        <div className="lg:col-span-3">
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">All Exam Types</option>
            <option value="mid-sem">Mid-Semester</option>
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
            {[2025, 2024, 2023, 2022].map(y => (
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
        <div className="glass-panel rounded-2xl p-12 text-center border border-gray-800">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No question papers found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or year selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {papers.map((paper) => (
            <div
              key={paper.id}
              className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4 border border-gray-800 hover:border-purple-500/40 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {paper.exam_type === 'mid-sem' ? 'Mid-Semester' : 'University End-Sem'}
                  </span>
                  <div className="flex items-center space-x-1 text-[11px] text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded-md border border-gray-700/50">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span>{paper.year}</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
                  {paper.title}
                </h3>
                <p className="text-[11px] text-indigo-400 font-medium mt-1">{paper.subject_name || paper.subject_code}</p>
              </div>

              <div className="pt-4 border-t border-gray-800/80 flex items-center space-x-2">
                <Link
                  href={`/student/chat?query=Solve question paper: ${encodeURIComponent(paper.title)}`}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Solve with AI</span>
                </Link>

                <a
                  href={paper.file_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                  title="Download Paper PDF"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
