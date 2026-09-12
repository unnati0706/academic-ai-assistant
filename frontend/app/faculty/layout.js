'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, LogOut, User } from 'lucide-react';
import { getStoredUser, clearSession } from '@/lib/auth';

export default function FacultyLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const syncUser = () => {
      const stored = getStoredUser();
      let profile = null;
      try {
        const storedProfile = localStorage.getItem('faculty_profile');
        if (storedProfile) {
          profile = JSON.parse(storedProfile);
        } else {
          const storedProfiles = localStorage.getItem('faculty_profiles');
          if (storedProfiles) {
            const list = JSON.parse(storedProfiles);
            profile = list[0];
          }
        }
      } catch (_) {}

      setUser({
        ...stored,
        email: profile?.email || stored?.email || 'dr.smith@academic.edu',
        name: profile?.name || stored?.name || 'Dr. Robert Smith'
      });
    };

    syncUser();
    window.addEventListener('storage', syncUser);
    window.addEventListener('user-updated', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('user-updated', syncUser);
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#151f1d] text-[#f4f1ea]">
      {/* Top Faculty Header */}
      <header className="sticky top-0 z-40 bg-[#151f1d]/90 backdrop-blur-md border-b border-[#2e433e]/70 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-[#4f7c6e]/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-[#f4f1ea]">Academic<span className="gradient-text">AI</span></span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#4f7c6e]/20 text-[#8fb1a5] border border-[#4f7c6e]/30">Faculty Portal</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-[#8fb1a5] bg-[#1e2c29] px-3 py-1.5 rounded-lg border border-[#2e433e]">
              <User className="w-3.5 h-3.5 text-[#5ea891]" />
              <span className="font-medium font-mono text-[11px] text-[#c8ded7]">{user?.email || 'dr.smith@academic.edu'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-[#1e2c29] hover:bg-[#2e433e] text-[#8fb1a5] hover:text-[#f4f1ea] border border-[#2e433e] transition-colors"
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
