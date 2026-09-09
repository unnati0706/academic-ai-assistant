'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, BookOpen, FileText, GraduationCap, Sparkles } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Overview',
      href: '/student/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Academic RAG Chat',
      href: '/student/chat',
      icon: MessageSquare,
      badge: 'AI',
    },
    {
      name: 'Study Materials',
      href: '/student/materials',
      icon: BookOpen,
    },
    {
      name: 'Question Papers',
      href: '/student/papers',
      icon: FileText,
    },
  ];

  return (
    <aside className="w-64 border-r border-gray-800/60 bg-[#0d121f] flex flex-col justify-between shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center space-x-3 px-6 border-b border-gray-800/60">
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Academic<span className="gradient-text">AI</span>
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
            Student Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20 font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{item.badge}</span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Info */}
      <div className="p-4 border-t border-gray-800/60">
        <div className="glass-panel p-3 rounded-xl flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-white">RAG Engine Online</div>
            <div className="text-[9px] text-gray-400">Model: Gemini 2.5 Flash</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
