"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  GraduationCap,
  History,
  BarChart3,
  Bot,
  Settings,
  LogOut,
  X,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  user?: { name: string; email: string; role: string } | null;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/attendance", label: "Take Attendance", icon: ClipboardCheck, badge: "Daily" },
  { href: "/students", label: "Students", icon: Users },
  { href: "/classes", label: "Classes", icon: GraduationCap },
  { href: "/history", label: "Attendance History", icon: History },
  { href: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot, isAi: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ mobileOpen, setMobileOpen, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
    } finally {
      setLoggingOut(false);
    }
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-white w-64 border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/60">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight flex items-center gap-1.5">
              <span>Record Hub</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Smart Records</p>
          </div>
        </Link>
        {setMobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Main Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold"
                  : item.isAi
                  ? "text-indigo-300 hover:bg-indigo-950/50 hover:text-white border border-indigo-900/50"
                  : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? "text-white" : item.isAi ? "text-indigo-400" : "text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.isAi ? (
                <span className="flex items-center gap-1 text-[10px] bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gemini
                </span>
              ) : item.badge ? (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    isActive ? "bg-indigo-700 text-indigo-100" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>

      {/* User Footer & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-600 flex items-center justify-center font-bold text-xs text-white">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || "Staff Member"}</p>
              <p className="text-[11px] text-slate-400 capitalize truncate">{user?.role || "Teacher"}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors border border-red-950/50"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-30">{sidebarContent}</aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMobileOpen && setMobileOpen(false)}
          />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
