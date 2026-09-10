'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, BookOpen, FileText, Bell, ArrowRight, Download, CheckCircle2, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { getDocumentUrl } from '@/lib/supabase';

export default function StudentDashboard() {
  const [announcements, setAnnouncements] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
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
    async function loadData() {
      try {
        const [annRes, matRes] = await Promise.all([
          api.getAnnouncements().catch(() => []),
          api.getMaterials().catch(() => [])
        ]);
        setAnnouncements(annRes || []);
        setMaterials(matRes || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative rounded-2xl p-8 overflow-hidden gradient-bg text-white shadow-2xl shadow-indigo-900/30">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to Student Portal</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">
            Academic AI Knowledge & Study Center
          </h1>
          <p className="text-indigo-100 text-sm leading-relaxed mb-6">
            Explore faculty course materials and ask questions using our floating RAG AI assistant.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/student/materials"
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-950 hover:bg-gray-100 font-semibold text-xs flex items-center space-x-2 shadow-lg transition-all"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Browse Course Materials</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{materials.length}</div>
            <div className="text-xs text-gray-400 font-medium">Uploaded Materials</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">{announcements.length}</div>
            <div className="text-xs text-gray-400 font-medium">Announcements</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">RAG Active</div>
            <div className="text-xs text-gray-400 font-medium">OCR & Vector Ingestion</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">100%</div>
            <div className="text-xs text-gray-400 font-medium">Syllabus Verified</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Announcements & Recent Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Announcements */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Active Announcements</h3>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading announcements...</div>
            ) : announcements.length === 0 ? (
              <div className="glass-card p-6 rounded-xl text-center text-xs text-gray-400 border border-gray-800">
                No active announcements found.
              </div>
            ) : (
              announcements.map((ann) => (
                <div key={ann.id} className="glass-card p-4 rounded-xl border border-gray-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-sm font-semibold text-white">{ann.title}</h4>
                    {ann.created_at && (
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{ann.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Study Materials */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <h3 className="text-base font-bold text-white">Recent Course Materials</h3>
            </div>
            <Link href="/student/materials" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading course materials...</div>
            ) : materials.length === 0 ? (
              <div className="glass-card p-6 rounded-xl text-center text-xs text-gray-400 border border-gray-800">
                No uploaded faculty materials yet. Materials will appear here once uploaded by faculty.
              </div>
            ) : (
              materials.slice(0, 4).map((mat) => (
                <div key={mat.id} className="glass-card p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 uppercase">
                        {mat.material_type || 'PDF'}
                      </span>
                      {mat.semester && (
                        <span className="text-[10px] text-gray-400">Sem {mat.semester}</span>
                      )}
                      {mat.unit && (
                        <span className="text-[10px] text-gray-400">• Unit {mat.unit}</span>
                      )}
                    </div>
                    <h4 className="text-xs font-semibold text-white line-clamp-1">{mat.title}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">{mat.subject_name || 'Computer Science'}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {mat.file_url && (
                      <a
                        href={mat.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 transition-colors flex items-center space-x-1 text-xs"
                        title="View PDF"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View</span>
                      </a>
                    )}
                    {mat.file_url && (
                      <a
                        href={mat.file_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                        title="Download File"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
