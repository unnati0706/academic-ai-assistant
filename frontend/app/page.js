'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      if (user.role === 'faculty' || user.role === 'faculty_admin') {
        router.replace('/faculty/dashboard');
      } else {
        router.replace('/student/dashboard');
      }
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbf9f5]">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#749190] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[#465F64] text-sm font-semibold">Loading AcademicAI...</p>
      </div>
    </div>
  );
}
