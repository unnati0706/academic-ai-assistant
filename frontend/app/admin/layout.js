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
    <div className="min-h-screen bg-[#fbf9f5] text-[#263339] flex flex-col">
      {/* Top Admin Bar */}
      <header className="h-16 border-b border-[#D8D6C9] bg-white/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-4">
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white shadow-md shadow-[#749190]/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-[#263339]">Faculty Admin Console</span>
            <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#E6D9B9] text-[#263339] font-bold border border-[#D8D6C9]">Admin Mode</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            href="/student/dashboard"
            className="text-xs text-[#465F64] hover:text-[#263339] flex items-center space-x-1 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Switch to Student View</span>
          </Link>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-red-50 border border-[#D8D6C9] text-red-600 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
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
