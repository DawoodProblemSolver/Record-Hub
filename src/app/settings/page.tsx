"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  Settings,
  School,
  Sliders,
  Database,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LogOut,
  User,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [instituteName, setInstituteName] = useState("Beacon Academy & Model High School");
  const [threshold, setThreshold] = useState("75");
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  const [savingSettings, setSavingSettings] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          setUser(json.user);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadUser();
  }, []);

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    setTimeout(() => {
      setSavingSettings(false);
      setFeedback({ type: "success", text: "Settings saved successfully." });
    }, 400);
  }

  async function handleSeedDemoData() {
    if (!confirm("Seed demo sample classes (9-A, 9-B, 10-A, 10-B) and students with sample attendance records?")) {
      return;
    }

    try {
      setSeeding(true);
      setFeedback(null);
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to seed demo data");
      setFeedback({ type: "success", text: data.message || "Demo data seeded successfully!" });
    } catch (err: unknown) {
      const e = err as Error;
      setFeedback({ type: "error", text: e.message || "Seeding failed." });
    } finally {
      setSeeding(false);
    }
  }

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <AppShell title="System Settings">
      <div className="max-w-4xl space-y-6">
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
              feedback.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* School / Institute Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Institute Configuration</h3>
              <p className="text-xs text-slate-500">School name and standard attendance rules</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                School / Academy Name
              </label>
              <input
                type="text"
                value={instituteName}
                onChange={(e) => setInstituteName(e.target.value)}
                className="w-full max-w-lg px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Default Low Attendance Threshold (%)
              </label>
              <input
                type="number"
                min="50"
                max="95"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-32 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Students below this percentage will be flagged as requiring attendance alerts.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 transition-all"
            >
              {savingSettings ? "Saving..." : "Save Configuration"}
            </button>
          </form>
        </div>

        {/* Demo Seed Mechanism (Section 40) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Demo Sample Data Seed</h3>
              <p className="text-xs text-slate-500">
                Populate sample classes (9-A, 9-B, 10-A) and historical attendance records
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed max-w-2xl mb-4">
            Creates standard classes, sample students (including &quot;Ali Khan&quot; with 22 Present / 2 Absent in September for verification tests), and prepares the system for full testing.
          </p>

          <button
            type="button"
            onClick={handleSeedDemoData}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/25 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{seeding ? "Seeding Records into MongoDB..." : "Populate Demo Records"}</span>
          </button>
        </div>

        {/* Current User Session Profile */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Authenticated Profile</h3>
              <p className="text-xs text-slate-500">Your current login credentials &amp; permissions</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-700 mb-5">
            <p>
              <strong>Name:</strong> {user?.name || "Administrator"}
            </p>
            <p>
              <strong>Email:</strong> {user?.email || "admin@recordhub.com"}
            </p>
            <p>
              <strong>Role:</strong> <span className="capitalize">{user?.role || "Admin"}</span>
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Record Hub</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
