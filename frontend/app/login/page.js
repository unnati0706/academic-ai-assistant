'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, ShieldCheck, ArrowRight } from 'lucide-react';
import { setSession, MOCK_STUDENT_USER, MOCK_FACULTY_USER } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'faculty'

  const handleDemoLogin = (role) => {
    if (role === 'faculty') {
      setSession('demo_faculty_token_12345', MOCK_FACULTY_USER);
      router.push('/faculty/dashboard');
    } else {
      setSession('demo_student_token_12345', MOCK_STUDENT_USER);
      router.push('/student/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbf9f5] text-[#263339] p-4">
      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#749190]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#E6D9B9]/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D8D6C9]/25 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-bg shadow-xl shadow-[#749190]/20 mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#263339]">
            Academic<span className="gradient-text">AI</span>
          </h1>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#D8D6C9] shadow-xl shadow-[#263339]/5">
          {/* Role Selector Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-[#465F64] uppercase tracking-wider mb-2">Select Portal Role</label>
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-[#fbf9f5] border border-[#D8D6C9]">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${selectedRole === 'student'
                  ? 'bg-[#749190] text-white shadow-md shadow-[#749190]/25'
                  : 'text-[#465F64] hover:text-[#263339]'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student Portal</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('faculty')}
                className={`py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-2 ${selectedRole === 'faculty'
                  ? 'bg-[#749190] text-white shadow-md shadow-[#749190]/25'
                  : 'text-[#465F64] hover:text-[#263339]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Faculty Portal</span>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#263339] tracking-tight">
              {selectedRole === 'faculty' ? 'Faculty Sign In' : 'Student Sign In'}
            </h2>
          </div>

          {/* Instant Sign-In Action Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => handleDemoLogin(selectedRole)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-[#E6D9B9]/50 hover:bg-[#E6D9B9]/80 border border-[#D8D6C9] text-[#263339] text-xs font-bold shadow-sm transition-all"
            >
              <span>Instant {selectedRole === 'faculty' ? 'Faculty' : 'Student'} Sign-In</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#749190]" />
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[#465F64]/70 mt-6">
          © 2026 AcademicAI Portal. All rights reserved.
        </p>
      </div>
    </div>
  );
}