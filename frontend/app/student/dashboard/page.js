'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, BookOpen, FileText, MessageSquare, Bell, ArrowRight, Download, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function StudentDashboard() {
  const [announcements, setAnnouncements] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [annRes, matRes] = await Promise.all([
          api.getAnnouncements().catch(() => []),
          api.getMaterials({ semester: 5 }).catch(() => [])
        ]);
        setAnnouncements(annRes.length ? annRes : [
          { id: 1, title: "Mid-Term Exam Schedule Announced", content: "Mid-term exams for Semester 5 commence from October 15th.", created_at: "2026-09-08" },
          { id: 2, title: "DBMS Lab Manual Updated", content: "Version 2.0 of Relational Algebra and SQL queries uploaded.", created_at: "2026-09-07" }
        ]);
        setMaterials(matRes.length ? matRes : [
          { id: '1', title: 'Data Structures & Algorithms - Unit 1 Notes', subject_name: 'Data Structures', material_type: 'notes', unit: 1, file_url: '#' },
          { id: '2', title: 'Operating Systems System Calls Guide', subject_name: 'Operating Systems', material_type: 'reference', unit: 2, file_url: '#' },
          { id: '3', title: 'Database Management Systems Syllabus & Blueprint', subject_name: 'DBMS', material_type: 'syllabus', unit: 1, file_url: '#' }
        ]);
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
            <span>Welcome back, Student</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-3">
            Academic AI Knowledge Portal
          </h1>
          <p className="text-indigo-100 text-sm leading-relaxed mb-6">
            Search verified course materials, question papers, and query our RAG AI assistant for instant, cited answers directly from your curriculum.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/student/chat"
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-950 hover:bg-gray-100 font-semibold text-xs flex items-center space-x-2 shadow-lg transition-all"
            >
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Launch RAG AI Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/student/materials"
              className="px-4 py-2.5 rounded-xl bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-300/30 text-white font-medium text-xs flex items-center space-x-2 transition-all"
            >
              <BookOpen className="w-4 h-4 text-indigo-200" />
              <span>Browse Materials</span>
            </Link>
          </div>
        </div>

        {/* Decorative Graphic Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">6</div>
            <div className="text-xs text-gray-400 font-medium">Enrolled Subjects</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">42</div>
            <div className="text-xs text-gray-400 font-medium">Verified Materials</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-white">18</div>
            <div className="text-xs text-gray-400 font-medium">AI Chat Queries</div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Active Announcements</h3>
            </div>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="glass-card p-4 rounded-xl border border-gray-800">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-sm font-semibold text-white">{ann.title}</h4>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Study Materials */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <h3 className="text-base font-bold text-white">Recent Study Materials</h3>
            </div>
            <Link href="/student/materials" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {materials.slice(0, 3).map((mat) => (
              <div key={mat.id} className="glass-card p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 uppercase">
                      {mat.material_type || 'PDF'}
                    </span>
                    {mat.unit && (
                      <span className="text-[10px] text-gray-400">Unit {mat.unit}</span>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-white line-clamp-1">{mat.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">{mat.subject_name || 'Computer Science'}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/student/chat?query=Explain ${encodeURIComponent(mat.title)}`}
                    className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors"
                    title="Ask AI about this"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </Link>
                  <a
                    href={mat.file_url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
