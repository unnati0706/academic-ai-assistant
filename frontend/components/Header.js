'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, User, LogOut, ChevronDown, BookOpen, GraduationCap } from 'lucide-react';
import { getStoredUser, clearSession } from '@/lib/auth';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <header className="h-16 border-b border-gray-800/60 bg-[#0d121f]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left side: Semester Badge & Branch info */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <GraduationCap className="w-4 h-4 text-indigo-400" />
          <span>Semester 5 • Computer Science & Engineering</span>
        </div>
      </div>

      {/* Right side: Search, Notifications, Profile */}
      <div className="flex items-center space-x-4">
        {/* Notifications Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-lg bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700/50 flex items-center justify-center text-gray-300 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 glass-panel rounded-xl shadow-2xl p-4 z-50 border border-gray-700/60">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Announcements</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">2 New</span>
              </div>
              <div className="space-y-3">
                <div className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition-all">
                  <h5 className="text-xs font-semibold text-white">Mid-Term Examination Schedule Released</h5>
                  <p className="text-[11px] text-gray-400 mt-1">Mid-term exams start October 15th. Check paper archives for prep.</p>
                  <span className="text-[10px] text-gray-500 mt-1.5 block">2 hours ago</span>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition-all">
                  <h5 className="text-xs font-semibold text-white">Unit 3 Machine Learning Slides Updated</h5>
                  <p className="text-[11px] text-gray-400 mt-1">New reference material uploaded by Dr. Smith.</p>
                  <span className="text-[10px] text-gray-500 mt-1.5 block">Yesterday</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-gray-800/60 transition-colors border border-transparent hover:border-gray-700/50"
          >
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-xs shadow-md shadow-indigo-500/20">
              {user?.name ? user.name.charAt(0) : 'S'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">{user?.name || 'Student Portal'}</div>
              <div className="text-[10px] text-indigo-300">{user?.role === 'faculty_admin' ? 'Faculty Admin' : 'CS Student'}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl shadow-2xl p-2 z-50 border border-gray-700/60">
              <div className="px-3 py-2 border-b border-gray-800 mb-1">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Student'}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.email || 'student@academic.edu'}</p>
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
