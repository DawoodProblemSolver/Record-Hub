"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  BarChart3,
  Calendar,
  GraduationCap,
  Users,
  AlertTriangle,
  Download,
  Filter,
  ArrowUpDown,
  Search,
  CheckCircle2,
} from "lucide-react";
import { getTodayDateString } from "@/lib/calculations/attendance";

interface ClassOption {
  _id: string;
  className: string;
  section: string;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"daily" | "monthly" | "yearly" | "class" | "low">("daily");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter values
  const today = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(today.substring(0, 7)); // e.g. 2026-09
  const [selectedYear, setSelectedYear] = useState(today.substring(0, 4));
  const [selectedClassId, setSelectedClassId] = useState("");
  const [threshold, setThreshold] = useState(75);
  const [classSortBy, setClassSortBy] = useState<"percentage_asc" | "percentage_desc" | "rollNumber">("percentage_asc");

  // Report Data States
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [yearlyData, setYearlyData] = useState<any[]>([]);
  const [classReportData, setClassReportData] = useState<any>(null);
  const [lowAttendanceData, setLowAttendanceData] = useState<any[]>([]);

  // Load classes
  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await fetch("/api/classes");
        if (res.ok) {
          const json = await res.json();
          setClasses(json.classes || []);
          if (json.classes && json.classes.length > 0) {
            setSelectedClassId(json.classes[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadClasses();
  }, []);

  // Fetch report data whenever active tab or filters change
  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      try {
        if (activeTab === "daily") {
          const res = await fetch(`/api/reports/daily?date=${selectedDate}`);
          if (res.ok) {
            const json = await res.json();
            setDailyData(json.report || []);
          }
        } else if (activeTab === "monthly") {
          const params = new URLSearchParams({ month: selectedMonth });
          if (selectedClassId) params.set("classId", selectedClassId);
          const res = await fetch(`/api/reports/monthly?${params.toString()}`);
          if (res.ok) {
            const json = await res.json();
            setMonthlyData(json.report || []);
          }
        } else if (activeTab === "yearly") {
          const params = new URLSearchParams({ year: selectedYear });
          if (selectedClassId) params.set("classId", selectedClassId);
          const res = await fetch(`/api/reports/yearly?${params.toString()}`);
          if (res.ok) {
            const json = await res.json();
            setYearlyData(json.report || []);
          }
        } else if (activeTab === "class" && selectedClassId) {
          const res = await fetch(
            `/api/reports/class?classId=${selectedClassId}&sortBy=${classSortBy}&month=${selectedMonth}`
          );
          if (res.ok) {
            const json = await res.json();
            setClassReportData(json);
          }
        } else if (activeTab === "low") {
          const params = new URLSearchParams({ threshold: threshold.toString() });
          if (selectedClassId) params.set("classId", selectedClassId);
          const res = await fetch(`/api/reports/low-attendance?${params.toString()}`);
          if (res.ok) {
            const json = await res.json();
            setLowAttendanceData(json.students || []);
          }
        }
      } catch (err) {
        console.error("Failed to load report:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [
    activeTab,
    selectedDate,
    selectedMonth,
    selectedYear,
    selectedClassId,
    threshold,
    classSortBy,
  ]);

  return (
    <AppShell title="Attendance Reports & Analytics">
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap gap-1.5">
          {[
            { id: "daily", label: "Daily Report", icon: Calendar },
            { id: "monthly", label: "Monthly Report", icon: BarChart3 },
            { id: "yearly", label: "Yearly Report", icon: Calendar },
            { id: "class", label: "Class Analysis", icon: GraduationCap },
            { id: "low", label: "Low Attendance Alert (< 75%)", icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Daily Date Filter */}
            {activeTab === "daily" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
            )}

            {/* Monthly / Class Month Filter */}
            {(activeTab === "monthly" || activeTab === "class") && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
            )}

            {/* Yearly Filter */}
            {activeTab === "yearly" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Year:</span>
                <input
                  type="number"
                  min="2020"
                  max="2030"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
            )}

            {/* Class Filter */}
            {(activeTab === "monthly" ||
              activeTab === "yearly" ||
              activeTab === "class" ||
              activeTab === "low") && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Class:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                >
                  {activeTab !== "class" && <option value="">All Classes</option>}
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      Class {cls.className}-{cls.section}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Low Attendance Threshold */}
            {activeTab === "low" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Threshold:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-16 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  />
                  <span className="text-xs font-bold text-slate-500">%</span>
                </div>
              </div>
            )}

            {/* Class Sorting Selector */}
            {activeTab === "class" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Sort by:</span>
                <select
                  value={classSortBy}
                  onChange={(e) => setClassSortBy(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="percentage_asc">Lowest % first</option>
                  <option value="percentage_desc">Highest % first</option>
                  <option value="rollNumber">Roll Number</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-sm">Calculating report statistics...</div>
          ) : (
            <>
              {/* 1. Daily Report Table */}
              {activeTab === "daily" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-6">Class</th>
                        <th className="py-3.5 px-6">Date</th>
                        <th className="py-3.5 px-6 text-center">Total Students</th>
                        <th className="py-3.5 px-6 text-center">Present</th>
                        <th className="py-3.5 px-6 text-center">Absent</th>
                        <th className="py-3.5 px-6 text-center">Attendance %</th>
                        <th className="py-3.5 px-6 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dailyData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            No classes or data recorded for this date.
                          </td>
                        </tr>
                      ) : (
                        dailyData.map((row) => (
                          <tr key={row.classId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-6 font-bold text-slate-900">
                              Class {row.className}-{row.section}
                            </td>
                            <td className="py-3.5 px-6 text-slate-600 text-xs">{row.date}</td>
                            <td className="py-3.5 px-6 text-center font-semibold text-slate-700">
                              {row.totalStudents}
                            </td>
                            <td className="py-3.5 px-6 text-center font-bold text-emerald-600">
                              {row.presentCount}
                            </td>
                            <td className="py-3.5 px-6 text-center font-bold text-red-600">
                              {row.absentCount}
                            </td>
                            <td className="py-3.5 px-6 text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${
                                  row.percentage >= 75
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {row.percentage}%
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-right">
                              {row.isMarked ? (
                                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Marked
                                </span>
                              ) : (
                                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                  Not Marked
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 2. Monthly Report Table */}
              {activeTab === "monthly" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-6">Roll No</th>
                        <th className="py-3.5 px-6">Student Name</th>
                        <th className="py-3.5 px-6">Class</th>
                        <th className="py-3.5 px-6 text-center">Present Days</th>
                        <th className="py-3.5 px-6 text-center">Absent Days</th>
                        <th className="py-3.5 px-6 text-center">Total Marked Days</th>
                        <th className="py-3.5 px-6 text-right">Attendance %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthlyData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            No student records found for {selectedMonth}.
                          </td>
                        </tr>
                      ) : (
                        monthlyData.map((row) => (
                          <tr key={row.studentId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-6 font-mono font-bold text-slate-700">
                              #{row.rollNumber}
                            </td>
                            <td className="py-3.5 px-6 font-bold text-slate-900">{row.name}</td>
                            <td className="py-3.5 px-6 text-xs text-slate-600">
                              {row.className}-{row.section}
                            </td>
                            <td className="py-3.5 px-6 text-center font-bold text-emerald-600">
                              {row.presentCount}
                            </td>
                            <td className="py-3.5 px-6 text-center font-bold text-red-600">
                              {row.absentCount}
                            </td>
                            <td className="py-3.5 px-6 text-center font-medium text-slate-600">
                              {row.totalDays}
                            </td>
                            <td className="py-3.5 px-6 text-right">
                              <span
                                className={`inline-block px-3 py-0.5 rounded-full text-xs font-black ${
                                  row.percentage >= 75
                                    ? "bg-emerald-100 text-emerald-800"
                                    : row.totalDays === 0
                                    ? "bg-slate-100 text-slate-500"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {row.percentage}%
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 3. Yearly Report Table */}
              {activeTab === "yearly" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                        <th className="py-3.5 px-6">Roll No</th>
                        <th className="py-3.5 px-6">Student Name</th>
                        <th className="py-3.5 px-6">Class</th>
                        <th className="py-3.5 px-6 text-center">Present (Year)</th>
                        <th className="py-3.5 px-6 text-center">Absent (Year)</th>
                        <th className="py-3.5 px-6 text-center">Marked Sessions</th>
                        <th className="py-3.5 px-6 text-right">Yearly Attendance %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {yearlyData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            No records found for year {selectedYear}.
                          </td>
                        </tr>
                      ) : (
                        yearlyData.map((row) => (
                          <tr key={row.studentId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-6 font-mono font-bold text-slate-700">
                              #{row.rollNumber}
                            </td>
                            <td className="py-3.5 px-6 font-bold text-slate-900">{row.name}</td>
                            <td className="py-3.5 px-6 text-xs text-slate-600">
                              {row.className}-{row.section}
                            </td>
                            <td className="py-3.5 px-6 text-center font-bold text-emerald-600">
                              {row.presentCount}
                            </td>
                            <td className="py-3.5 px-6 text-center font-bold text-red-600">
                              {row.absentCount}
                            </td>
                            <td className="py-3.5 px-6 text-center font-medium text-slate-600">
                              {row.totalDays}
                            </td>
                            <td className="py-3.5 px-6 text-right">
                              <span
                                className={`inline-block px-3 py-0.5 rounded-full text-xs font-black ${
                                  row.percentage >= 75
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {row.percentage}%
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 4. Class Report */}
              {activeTab === "class" && (
                <div>
                  {classReportData && (
                    <div className="p-5 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">
                          Class {classReportData.class?.className}-{classReportData.class?.section} Detailed Analysis
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {classReportData.studentCount} students enrolled • Class Average:{" "}
                          <strong className="text-indigo-700">
                            {classReportData.classAveragePercentage}%
                          </strong>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                          <th className="py-3.5 px-6">Roll No</th>
                          <th className="py-3.5 px-6">Student Name</th>
                          <th className="py-3.5 px-6 text-center">Present</th>
                          <th className="py-3.5 px-6 text-center">Absent</th>
                          <th className="py-3.5 px-6 text-center">Total Marked</th>
                          <th className="py-3.5 px-6 text-right">Attendance %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {!classReportData?.report || classReportData.report.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400">
                              No student data available for this class.
                            </td>
                          </tr>
                        ) : (
                          classReportData.report.map((row: any) => (
                            <tr key={row.studentId} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-6 font-mono font-bold text-slate-700">
                                #{row.rollNumber}
                              </td>
                              <td className="py-3.5 px-6 font-bold text-slate-900">{row.name}</td>
                              <td className="py-3.5 px-6 text-center font-bold text-emerald-600">
                                {row.presentCount}
                              </td>
                              <td className="py-3.5 px-6 text-center font-bold text-red-600">
                                {row.absentCount}
                              </td>
                              <td className="py-3.5 px-6 text-center font-medium text-slate-600">
                                {row.totalDays}
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                <span
                                  className={`inline-block px-3 py-0.5 rounded-full text-xs font-black ${
                                    row.percentage >= 75
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {row.percentage}%
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 5. Low Attendance Section */}
              {activeTab === "low" && (
                <div>
                  <div className="p-4 bg-red-50/60 border-b border-red-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-red-950 text-sm">
                        Students With Attendance Below {threshold}%
                      </h4>
                      <p className="text-xs text-red-700 mt-0.5">
                        Identified {lowAttendanceData.length} students requiring attendance review.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                          <th className="py-3.5 px-6">Student Name</th>
                          <th className="py-3.5 px-6">Class</th>
                          <th className="py-3.5 px-6">Roll No</th>
                          <th className="py-3.5 px-6 text-center">Present</th>
                          <th className="py-3.5 px-6 text-center">Absent</th>
                          <th className="py-3.5 px-6 text-center">Total Marked</th>
                          <th className="py-3.5 px-6 text-right">Attendance Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lowAttendanceData.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400">
                              Good news! No students are below the {threshold}% threshold.
                            </td>
                          </tr>
                        ) : (
                          lowAttendanceData.map((row) => (
                            <tr key={row.studentId} className="hover:bg-red-50/30 transition-colors">
                              <td className="py-3.5 px-6 font-bold text-slate-900">{row.name}</td>
                              <td className="py-3.5 px-6 text-xs text-slate-600">
                                Class {row.className}-{row.section}
                              </td>
                              <td className="py-3.5 px-6 font-mono font-bold text-slate-700">
                                #{row.rollNumber}
                              </td>
                              <td className="py-3.5 px-6 text-center font-bold text-emerald-600">
                                {row.presentCount}
                              </td>
                              <td className="py-3.5 px-6 text-center font-bold text-red-600">
                                {row.absentCount}
                              </td>
                              <td className="py-3.5 px-6 text-center font-medium text-slate-600">
                                {row.totalDays}
                              </td>
                              <td className="py-3.5 px-6 text-right">
                                <span className="inline-block px-3 py-0.5 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-200">
                                  {row.percentage}%
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
