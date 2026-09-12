'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown, GraduationCap, Menu } from 'lucide-react';
import { getStoredUser, clearSession } from '@/lib/auth';

export default function Header({ onOpenMobileSidebar = () => {} }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <header className="h-16 border-b border-[#2e433e]/70 bg-[#151f1d]/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left side: Mobile Menu Button */}
      <div className="flex items-center space-x-2.5 sm:space-x-4">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="md:hidden p-2 rounded-xl bg-[#1e2c29] hover:bg-[#2e433e] text-[#8fb1a5] hover:text-[#f4f1ea] transition-colors border border-[#2e433e]"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand mark for mobile */}
        <div className="md:hidden flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-[#f4f1ea]">Academic<span className="gradient-text">AI</span></span>
        </div>
      </div>

      {/* Right side: Profile */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 sm:space-x-3 p-1 sm:p-1.5 rounded-xl hover:bg-[#1e2c29] transition-colors border border-transparent hover:border-[#2e433e]"
          >
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-xs shadow-md shadow-[#4f7c6e]/20 shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-[#f4f1ea] leading-tight">{user?.name || 'Student Portal'}</div>
              <div className="text-[10px] text-[#8fb1a5]">{user?.role === 'faculty_admin' ? 'Faculty Admin' : 'CS Student'}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8fb1a5] shrink-0" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 sm:w-56 glass-panel rounded-xl shadow-2xl p-2 z-50 border border-[#2e433e] animate-in fade-in duration-150">
              <div className="px-3 py-2 border-b border-[#2e433e] mb-1">
                <p className="text-xs font-semibold text-[#f4f1ea] truncate">{user?.name || 'Student'}</p>
                <p className="text-[10px] text-[#8fb1a5] truncate">{user?.email || 'student@academic.edu'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 flex items-center space-x-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
