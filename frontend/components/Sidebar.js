'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, FileText, GraduationCap, X } from 'lucide-react';

export default function Sidebar({ mobileOpen = false, onCloseMobile = () => {} }) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Overview',
      href: '/student/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Study Materials',
      href: '/student/materials',
      icon: BookOpen,
    },
    {
      name: 'Question Papers',
      href: '/student/papers',
      icon: FileText,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#D8D6C9]">
          <Link href="/student/dashboard" onClick={onCloseMobile} className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-md shadow-[#749190]/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#263339]">
              Academic<span className="gradient-text">AI</span>
            </span>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-[#465F64] hover:text-[#263339] hover:bg-[#fbf9f5] transition-colors"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-bold text-[#465F64]/70 uppercase tracking-wider">
            Student Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#749190] text-white shadow-md shadow-[#749190]/20 font-bold'
                    : 'text-[#465F64] hover:text-[#263339] hover:bg-[#fbf9f5]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#749190]'}`} />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-[#D8D6C9] bg-white flex-col shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer Aside */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white border-r border-[#D8D6C9] flex flex-col md:hidden shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
