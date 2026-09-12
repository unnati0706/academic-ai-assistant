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
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#2e433e]/70">
          <Link href="/student/dashboard" onClick={onCloseMobile} className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-[#4f7c6e]/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#f4f1ea]">
              Academic<span className="gradient-text">AI</span>
            </span>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-[#8fb1a5] hover:text-[#f4f1ea] hover:bg-[#2e433e]/80 transition-colors"
            title="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-bold text-[#8fb1a5]/60 uppercase tracking-wider">
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
                className={`flex items-center px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#4f7c6e] to-[#3d6459] text-white shadow-md shadow-[#4f7c6e]/20 font-semibold'
                    : 'text-[#8fb1a5] hover:text-[#f4f1ea] hover:bg-[#2e433e]/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#8fb1a5]'}`} />
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
      <aside className="hidden md:flex w-64 border-r border-[#2e433e]/70 bg-[#151f1d] flex-col shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer Aside */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#151f1d] border-r border-[#2e433e] flex flex-col md:hidden shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
