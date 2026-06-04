import { useApp } from '../context/AppContext.js';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  ShieldCheck,
  Award,
  CalendarCheck,
  Notebook,
  FileText,
  Clock,
  LogOut,
  Sliders,
  Menu,
  X
} from 'lucide-react';
import { useState, useTransition } from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, isOpen, setIsOpen }: SidebarProps) {
  const { user, logout } = useApp();
  const [, startTransition] = useTransition();

  if (!user) return null;

  // Navigation Items per Role
  const adminNav = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', name: 'Student Records', icon: GraduationCap },
    { id: 'staff', name: 'Staff Directory', icon: Users },
    { id: 'attendance', name: 'Attendance Manager', icon: CalendarCheck },
    { id: 'exams', name: 'Examinations', icon: Notebook },
    { id: 'results', name: 'Result Processing', icon: Award },
    { id: 'classes', name: 'School Classes', icon: Sliders },
  ];

  const teacherNav = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', name: 'Student Directory', icon: GraduationCap },
    { id: 'attendance', name: 'Mark Attendance', icon: CalendarCheck },
    { id: 'results', name: 'Exams & Grading', icon: Award },
  ];

  const studentNav = [
    { id: 'dashboard', name: 'My Profile', icon: GraduationCap },
    { id: 'attendance', name: 'My Attendance', icon: CalendarCheck },
    { id: 'exams', name: 'My Scores & Exams', icon: Award },
  ];

  const parentNav = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'attendance', name: 'Student Attendance', icon: CalendarCheck },
    { id: 'exams', name: 'Report Cards & Exams', icon: Award },
  ];

  const navItems = {
    admin: adminNav,
    teacher: teacherNav,
    student: studentNav,
    parent: parentNav,
  }[user.role] || [];

  const handleTabChange = (tabId: string) => {
    startTransition(() => {
      setActiveTab(tabId);
      setIsOpen(false); // Close on mobile
    });
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0F172A] text-slate-300 flex flex-col justify-between border-r border-slate-800/40 transition-transform duration-300 transform lg:translate-x-0 glass-sidebar ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo and App Title */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/40">
            <div className="flex items-center gap-2.5">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/20">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                LGEA PRIMARY SCHOOL DUTSE
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Profile Summary */}
          <div className="p-5 border-b border-slate-800/40 bg-slate-950/20">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-sm">
                {user.fullName.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="truncate flex-1">
                <div className="font-bold text-sm text-slate-200 truncate">{user.fullName}</div>
                <div className="text-[10px] text-slate-400 capitalize flex items-center gap-1 mt-0.5 font-semibold tracking-wide">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  {user.role} Acc
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-295px)] mt-2">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider px-3 mb-2 block">
              Navigation
            </span>
            {navItems.map(item => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/25 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent'
                  }`}
                >
                  <IconComp className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Area with System Status & Logout */}
        <div className="p-4 space-y-4 border-t border-slate-800/40">
          {/* Status Indicator from design mockup */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">System Status</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-slate-300 font-medium">Cloud Server Online</span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-400 hover:text-white hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-950/40"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
