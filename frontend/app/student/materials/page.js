'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, BookOpen, Download, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function MaterialsPage() {
  const [semester, setSemester] = useState('5');
  const [unit, setUnit] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const mockMaterialsList = [
    {
      id: 'm1',
      title: 'Data Structures & Algorithms - Unit 1 Notes',
      description: 'Comprehensive notes covering Stacks, Queues, Linked Lists, and Analysis of Algorithms.',
      subject_name: 'Data Structures & Algorithms',
      subject_code: 'CS-501',
      semester: 5,
      unit: 1,
      material_type: 'notes',
      file_url: '#',
      created_at: '2026-09-01'
    },
    {
      id: 'm2',
      title: 'Operating Systems - Process Synchronization & Deadlocks',
      description: 'Detailed slides and solved examples on Semaphores, Peterson Algorithm, and Banker Algorithm.',
      subject_name: 'Operating Systems',
      subject_code: 'CS-502',
      semester: 5,
      unit: 2,
      material_type: 'reference',
      file_url: '#',
      created_at: '2026-09-03'
    },
    {
      id: 'm3',
      title: 'Database Management Systems - ER Diagram to Relational Schema',
      description: 'Complete tutorial on ER modeling, functional dependencies, 3NF, and BCNF normalization.',
      subject_name: 'Database Management Systems',
      subject_code: 'CS-503',
      semester: 5,
      unit: 3,
      material_type: 'notes',
      file_url: '#',
      created_at: '2026-09-05'
    },
    {
      id: 'm4',
      title: 'Computer Networks - TCP/IP Protocol Suite & Subnetting',
      description: 'Handwritten notes explaining IPv4 subnetting, CIDR notation, and OSI model layers.',
      subject_name: 'Computer Networks',
      subject_code: 'CS-504',
      semester: 5,
      unit: 1,
      material_type: 'assignment',
      file_url: '#',
      created_at: '2026-09-06'
    },
    {
      id: 'm5',
      title: 'Software Engineering - Agile Methodologies & Scrum Blueprint',
      description: 'Reference document for Software Requirement Specification (SRS) and Agile sprint planning.',
      subject_name: 'Software Engineering',
      subject_code: 'CS-505',
      semester: 5,
      unit: 4,
      material_type: 'syllabus',
      file_url: '#',
      created_at: '2026-09-07'
    }
  ];

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
        if (res && res.length) {
          setMaterials(res);
        } else {
          // Filter mock list
          let filtered = mockMaterialsList;
          if (semester) filtered = filtered.filter(m => String(m.semester) === String(semester));
          if (unit) filtered = filtered.filter(m => String(m.unit) === String(unit));
          if (typeFilter) filtered = filtered.filter(m => m.material_type === typeFilter);
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(m => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
          }
          setMaterials(filtered);
        }
      } catch (err) {
        console.error("Fetch materials error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMaterials();
  }, [semester, unit, typeFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Academic Resource Explorer</h1>
          <p className="text-xs text-gray-400 mt-1">Browse, download, or ask AI about verified study materials and notes.</p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>{materials.length} Materials Available</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="lg:col-span-4 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search material title or keyword..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Semester Filter */}
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

        {/* Unit Selector */}
        <div className="lg:col-span-3">
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
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
            className="w-full px-3 py-2.5 bg-gray-900/90 border border-gray-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
          >
            <option value="">All Types</option>
            <option value="notes">Notes</option>
            <option value="reference">Reference</option>
            <option value="syllabus">Syllabus</option>
            <option value="assignment">Assignment</option>
          </select>
        </div>
      </div>

      {/* Resource Card Grid */}
      {loading ? (
        <div className="py-20 flex justify-center items-center space-x-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-gray-400 font-medium">Fetching study materials...</span>
        </div>
      ) : materials.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-gray-800">
          <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No materials found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or dropdown filters to view available resources.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-4 border border-gray-800 hover:border-indigo-500/40 transition-all group"
            >
              <div>
                {/* Header badges */}
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {mat.material_type || 'PDF'}
                  </span>
                  {mat.unit && (
                    <span className="text-[11px] font-semibold text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded-md border border-gray-700/50">
                      Unit {mat.unit}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                  {mat.title}
                </h3>
                <p className="text-[11px] text-indigo-400 font-medium mt-1">{mat.subject_name || mat.subject_code}</p>
                <p className="text-xs text-gray-400 mt-2 line-clamp-3 leading-relaxed">
                  {mat.description || 'Verified course document for semester preparation.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-800/80 flex items-center space-x-2">
                <Link
                  href={`/student/chat?query=Explain ${encodeURIComponent(mat.title)}`}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ask AI About This</span>
                </Link>

                <a
                  href={mat.file_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                  title="Download File"
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
