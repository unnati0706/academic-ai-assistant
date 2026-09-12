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
    <div className="min-h-screen bg-[#241f1e] text-[#f5efeb] flex flex-col">
      {/* Top Admin Bar */}
      <header className="h-16 border-b border-[#463c39]/80 bg-[#312a28]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          <div className="w-9 h-9 rounded-xl bg-[#b5c7d3] flex items-center justify-center text-[#2c2624] shadow-lg shadow-[#b5c7d3]/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-[#f5efeb]">Faculty Admin Console</span>
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-[#b5c7d3]/20 text-[#b5c7d3] font-semibold border border-[#b5c7d3]/30">Admin Mode</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/student/dashboard"
            className="text-xs text-[#c8bfb8] hover:text-[#f5efeb] flex items-center space-x-1 transition-colors"
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
