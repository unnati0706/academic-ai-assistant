'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import FloatingChatWidget from '@/components/FloatingChatWidget';

export default function StudentLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-[#0b0f19]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
      <FloatingChatWidget />
    </div>
  );
}
