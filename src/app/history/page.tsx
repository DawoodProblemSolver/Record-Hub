"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  History,
  Filter,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  Download,
  GraduationCap,
  Users,
} from "lucide-react";
import { getTodayDateString } from "@/lib/calculations/attendance";

interface AttendanceLogItem {
  _id: string;
  studentId: {
    _id: string;
    studentId: string;
    name: string;
    rollNumber: string;
    fatherName: string;
  };
  classId: {
    _id: string;
    className: string;
    section: string;
  };
  date: string;
  status: "present" | "absent";
  markedBy?: string;
  createdAt: string;
}

interface ClassOption {
  _id: string;
  className: string;
  section: string;
}

export default function HistoryPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [records, setRecords] = useState<AttendanceLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchName, setSearchName] = useState("");

  // Load Classes
  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await fetch("/api/classes");
        if (res.ok) {
          const json = await res.json();
          setClasses(json.classes || []);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadClasses();
  }, []);

  // Fetch Attendance History
  async function fetchHistory() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClass) params.set("classId", selectedClass);
      if (selectedStatus) params.set("status", selectedStatus);
      if (selectedDate) params.set("date", selectedDate);

      const res = await fetch(`/api/attendance?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, [selectedClass, selectedStatus, selectedDate]);

  // Client-side search for student name or roll
  const filteredRecords = records.filter((r) => {
    if (!searchName.trim()) return true;
    const nameMatch = r.studentId?.name?.toLowerCase().includes(searchName.toLowerCase());
    const rollMatch = r.studentId?.rollNumber?.includes(searchName);
    return nameMatch || rollMatch;
  });

  // Export to CSV
  function exportToCSV() {
    if (filteredRecords.length === 0) return;

    const headers = ["Date", "Roll Number", "Student Name", "Class", "Status", "Marked By"];
    const rows = filteredRecords.map((r) => [
      r.date,
      r.studentId?.rollNumber || "",
      r.studentId?.name || "",
      r.classId ? `${r.classId.className}-${r.classId.section}` : "",
      r.status.toUpperCase(),
      r.markedBy || "Teacher",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_history_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const presentCount = filteredRecords.filter((r) => r.status === "present").length;
  const absentCount = filteredRecords.filter((r) => r.status === "absent").length;

  return (
    <AppShell title="Attendance History">
      <div className="space-y-6">
        {/* Filters Bar */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
              {/* Search Name/Roll */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Search Student
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Name or roll #..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Class Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Filter by Class
                </label>
                <div className="relative">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  >
                    <option value="">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        Class {cls.className}-{cls.section}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specific Date Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Specific Date
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                >
                  <option value="">All Statuses</option>
                  <option value="present">Present Only</option>
                  <option value="absent">Absent Only</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-end pt-1">
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate("")}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Clear Date
                </button>
              )}
              <button
                onClick={exportToCSV}
                disabled={filteredRecords.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Summary */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-5 text-xs">
            <span className="text-slate-500">
              Matching Records: <strong className="text-slate-800">{filteredRecords.length}</strong>
            </span>
            <span className="text-emerald-700 font-semibold">
              Present: <strong>{presentCount}</strong>
            </span>
            <span className="text-red-700 font-semibold">
              Absent: <strong>{absentCount}</strong>
            </span>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-sm">Loading attendance logs...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16 text-center">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No records found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No attendance entries match your active date, class, or status filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 md:px-6">Date</th>
                    <th className="py-3 px-4 md:px-6">Roll No</th>
                    <th className="py-3 px-4 md:px-6">Student Name</th>
                    <th className="py-3 px-4 md:px-6">Class</th>
                    <th className="py-3 px-4 md:px-6">Attendance Status</th>
                    <th className="py-3 px-4 md:px-6 text-right">Marked By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((rec) => (
                    <tr key={rec._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 md:px-6 font-medium text-slate-800 text-xs">
                        {rec.date}
                      </td>
                      <td className="py-3 px-4 md:px-6 font-mono font-bold text-slate-700 text-xs">
                        #{rec.studentId?.rollNumber}
                      </td>
                      <td className="py-3 px-4 md:px-6 font-semibold text-slate-900 text-xs">
                        {rec.studentId?.name || "Student"}
                      </td>
                      <td className="py-3 px-4 md:px-6 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700 border border-slate-200">
                          {rec.classId ? `${rec.classId.className}-${rec.classId.section}` : "N/A"}
                        </span>
                      </td>
                      <td className="py-3 px-4 md:px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            rec.status === "present"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {rec.status === "present" ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Present</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-red-600" />
                              <span>Absent</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 md:px-6 text-right text-xs text-slate-500">
                        {rec.markedBy || "Teacher"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
