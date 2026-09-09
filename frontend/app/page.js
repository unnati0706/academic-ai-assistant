'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      if (user.role === 'faculty_admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/student/dashboard');
      }
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm font-medium">Loading AcademicAI...</p>
      </div>
    </div>
  );
}
