'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import FloatingChatWidget from '@/components/FloatingChatWidget';

export default function StudentLayout({ children }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#fbf9f5]">
      <Sidebar 
        mobileOpen={mobileSidebarOpen} 
        onCloseMobile={() => setMobileSidebarOpen(false)} 
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)} 
        />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
      <FloatingChatWidget />
    </div>
  );
}
