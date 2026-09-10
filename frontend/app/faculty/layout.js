'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, LogOut, ShieldCheck, User } from 'lucide-react';
import { getStoredUser, clearSession } from '@/lib/auth';

export default function FacultyLayout({ children }) {
  const router = useRouter();
  const user = getStoredUser();

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-gray-100">
      {/* Top Faculty Header */}
      <header className="sticky top-0 z-40 bg-[#0d121f]/90 backdrop-blur-md border-b border-gray-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-purple-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">Academic<span className="gradient-text">AI</span></span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">Faculty Portal</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-300 bg-gray-900/80 px-3 py-1.5 rounded-lg border border-gray-800">
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-medium">{user?.email || 'Dr. Faculty Member'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
