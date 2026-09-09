'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, ShieldCheck, LogOut, ArrowLeft } from 'lucide-react';
import { clearSession } from '@/lib/auth';

export default function AdminLayout({ children }) {
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col">
      {/* Top Admin Bar */}
      <header className="h-16 border-b border-gray-800/80 bg-[#0d121f]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-white">Faculty Admin Console</span>
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">Admin Mode</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/student/dashboard"
            className="text-xs text-gray-400 hover:text-white flex items-center space-x-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Switch to Student View</span>
          </Link>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
