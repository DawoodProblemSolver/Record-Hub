"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  UserCheck,
  UserX,
  Percent,
  PlusCircle,
  BarChart3,
  Bot,
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface DashboardData {
  stats: {
    totalStudents: number;
    totalClasses: number;
    todayPresent: number;
    todayAbsent: number;
    todayTotalMarked: number;
    todayPercentage: number;
    todayDate: string;
  };
  classSummaries: Array<{
    classId: string;
    className: string;
    section: string;
    totalStudents: number;
    markedCount: number;
    presentCount: number;
    absentCount: number;
    percentage: number;
    isCompleted: boolean;
  }>;
  lowAttendanceCount: number;
  lowAttendanceList: Array<{
    studentId: string;
    name: string;
    rollNumber: string;
    className: string;
    percentage: number;
    present: number;
    absent: number;
  }>;
  recentActivity: Array<{
    _id: string;
    studentId?: { name: string; rollNumber: string };
    classId?: { className: string; section: string };
    date: string;
    status: string;
    updatedAt: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        throw new Error("Unable to load dashboard data. Please try again.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <AppShell title="Executive Overview">
      <div className="space-y-8">
        {/* Welcome & Action Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-slate-800">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Smart Attendance Engine</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Welcome to Record Hub
              </h2>
              <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                Mark once. Store automatically. Analyze intelligently. Monitor today&apos;s attendance or explore AI insights below.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/attendance"
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Take Attendance</span>
              </Link>
              <Link
                href="/ai-assistant"
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Bot className="w-4 h-4" />
                <span>Ask AI Assistant</span>
              </Link>
              <button
                onClick={loadDashboard}
                disabled={loading}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm transition-colors border border-slate-700"
                title="Refresh statistics"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadDashboard}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* 5 Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Students */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Total Students
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
                {loading ? "..." : data?.stats.totalStudents ?? 0}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">Active enrolled students</p>
          </div>

          {/* Total Classes */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Total Classes
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
                {loading ? "..." : data?.stats.totalClasses ?? 0}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600">Configured sections</p>
          </div>

          {/* Today's Present */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Today&apos;s Present
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-emerald-800 tracking-tight">
                {loading ? "..." : data?.stats.todayPresent ?? 0}
              </span>
            </div>
            <p className="mt-1 text-xs text-emerald-700">Present in class</p>
          </div>

          {/* Today's Absent */}
          <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-800 uppercase tracking-wider">
                Today&apos;s Absent
              </span>
              <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <UserX className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-red-800 tracking-tight">
                {loading ? "..." : data?.stats.todayAbsent ?? 0}
              </span>
            </div>
            <p className="mt-1 text-xs text-red-700">Absent from school</p>
          </div>

          {/* Attendance % */}
          <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                Today&apos;s Rate
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Percent className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold text-indigo-800 tracking-tight">
                {loading ? "..." : `${data?.stats.todayPercentage ?? 0}%`}
              </span>
            </div>
            <p className="mt-1 text-xs text-indigo-700">
              {data?.stats.todayTotalMarked ? `${data.stats.todayTotalMarked} marked today` : "No records today"}
            </p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <Link
              href="/attendance"
              className="flex items-center gap-3 p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all group hover:border-indigo-300"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Take Attendance</p>
                <p className="text-[11px] text-slate-600">Daily roll call</p>
              </div>
            </Link>

            <Link
              href="/students"
              className="flex items-center gap-3 p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all group hover:border-indigo-300"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Add Student</p>
                <p className="text-[11px] text-slate-600">Enroll new student</p>
              </div>
            </Link>

            <Link
              href="/classes"
              className="flex items-center gap-3 p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all group hover:border-indigo-300"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Add Class</p>
                <p className="text-[11px] text-slate-600">Create new section</p>
              </div>
            </Link>

            <Link
              href="/reports"
              className="flex items-center gap-3 p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all group hover:border-indigo-300"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">View Reports</p>
                <p className="text-[11px] text-slate-600">Monthly & yearly</p>
              </div>
            </Link>

            <Link
              href="/ai-assistant"
              className="flex items-center gap-3 p-4 bg-gradient-to-tr from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200 rounded-xl shadow-sm transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-900">AI Assistant</p>
                <p className="text-[11px] text-indigo-700">Ask questions</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Two-Column Layout: Today's Class Breakdown & Low Attendance Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Class-by-Class Attendance Today (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-base text-slate-800">Today&apos;s Class Summary</h3>
                <p className="text-xs text-slate-600">Attendance status across all active classes</p>
              </div>
              <Link
                href="/attendance"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Take Attendance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-600 text-sm">Loading class status...</div>
            ) : !data?.classSummaries || data.classSummaries.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No classes created yet</p>
                <p className="text-xs text-slate-600 mt-1">Get started by creating your first class section.</p>
                <Link
                  href="/classes"
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Create Class</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.classSummaries.map((cls) => (
                  <div
                    key={cls.classId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/60 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-sm shadow-xs">
                        {cls.className}-{cls.section}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">
                          Class {cls.className} — Section {cls.section}
                        </h4>
                        <p className="text-xs text-slate-600">
                          {cls.totalStudents} total students enrolled
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      {cls.markedCount > 0 ? (
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xs font-semibold text-slate-800">
                              <span className="text-emerald-600 font-bold">{cls.presentCount} P</span>
                              <span className="mx-1 text-slate-300">/</span>
                              <span className="text-red-600 font-bold">{cls.absentCount} A</span>
                            </div>
                            <div className="text-[11px] font-medium text-slate-600">
                              {cls.percentage}% attendance
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              cls.isCompleted
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {cls.isCompleted ? "Completed" : "Partial"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-200/80 text-slate-600">
                            Not Marked Yet
                          </span>
                          <Link
                            href={`/attendance?classId=${cls.classId}`}
                            className="px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors"
                          >
                            Mark Now
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Attendance Alert Feed (1 Col) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Low Attendance (&lt; 75%)</h3>
                  <p className="text-[11px] text-slate-600">Students requiring intervention</p>
                </div>
              </div>
              <Link
                href="/reports?tab=low"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View all
              </Link>
            </div>

            <div className="flex-1 space-y-2.5">
              {loading ? (
                <div className="py-8 text-center text-slate-600 text-xs">Checking attendance rates...</div>
              ) : !data?.lowAttendanceList || data.lowAttendanceList.length === 0 ? (
                <div className="py-8 text-center text-slate-600 text-xs bg-slate-50 rounded-xl border border-slate-100">
                  <UserCheck className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  <p className="font-semibold text-slate-700">No low attendance alerts</p>
                  <p className="text-slate-600 mt-0.5">All active students are at or above 75%.</p>
                </div>
              ) : (
                data.lowAttendanceList.map((stu) => (
                  <div
                    key={stu.studentId}
                    className="p-3 bg-red-50/50 hover:bg-red-50 border border-red-100 rounded-xl flex items-center justify-between transition-colors"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{stu.name}</h4>
                      <p className="text-[11px] text-slate-600">
                        Class {stu.className} • Roll #{stu.rollNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-extrabold bg-red-100 text-red-700 border border-red-200">
                        {stu.percentage}%
                      </span>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {stu.present}P / {stu.absent}A
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link
                href="/ai-assistant?query=Which+students+are+below+75%"
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Ask AI to analyze low attendance</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
