"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppShell({ children, title }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Failed to load user info:", err);
      }
    }
    fetchMe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar (Desktop fixed, Mobile overlay) */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} user={user} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <Navbar onMenuClick={() => setMobileOpen(true)} user={user} title={title} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
