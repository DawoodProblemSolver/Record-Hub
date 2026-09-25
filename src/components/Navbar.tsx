"use client";

import { Menu, Calendar, Sparkles, PlusCircle } from "lucide-react";
import Link from "next/link";

interface NavbarProps {
  onMenuClick: () => void;
  user?: { name: string; email: string; role: string } | null;
  title?: string;
}

export default function Navbar({ onMenuClick, user, title }: NavbarProps) {
  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Date Display */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 rounded-lg text-xs font-medium text-slate-600 border border-slate-200/60">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{todayFormatted}</span>
        </div>

        {/* Quick Action: Take Attendance */}
        <Link
          href="/attendance"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Take Attendance</span>
        </Link>

        {/* AI Quick Access Button */}
        <Link
          href="/ai-assistant"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all hover:shadow"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Assistant</span>
        </Link>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center justify-center">
            {user?.name ? user.name[0].toUpperCase() : "U"}
          </div>
        </div>
      </div>
    </header>
  );
}
