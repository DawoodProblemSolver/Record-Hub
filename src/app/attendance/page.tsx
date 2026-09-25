"use client";

import { useEffect, useState, useTransition } from "react";
import AppShell from "@/components/AppShell";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Save,
  Check,
  X,
  AlertCircle,
  GraduationCap,
  Users,
  Search,
} from "lucide-react";
import { getTodayDateString } from "@/lib/calculations/attendance";

interface ClassOption {
  _id: string;
  className: string;
  section: string;
  studentCount?: number;
}

interface StudentAttendanceItem {
  _id: string;
  studentId: string;
  name: string;
  fatherName: string;
  rollNumber: string;
  classId: string;
  status: "present" | "absent" | null;
}

export default function AttendancePage() {
  const [, startTransition] = useTransition();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [students, setStudents] = useState<StudentAttendanceItem[]>([]);
  const [isAlreadyMarked, setIsAlreadyMarked] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 1. Fetch available classes on mount
  useEffect(() => {
    async function loadClasses() {
      try {
        setLoadingClasses(true);
        const res = await fetch("/api/classes");
        if (res.ok) {
          const json = await res.json();
          setClasses(json.classes || []);
          // Auto-select first class if available
          if (json.classes && json.classes.length > 0) {
            setSelectedClassId(json.classes[0]._id);
          }
        }
      } catch (err) {
        console.error("Failed to load classes:", err);
      } finally {
        setLoadingClasses(false);
      }
    }
    loadClasses();
  }, []);

  // 2. Load students and existing attendance whenever classId or date changes
  useEffect(() => {
    if (!selectedClassId || !selectedDate) return;

    async function loadClassAttendance() {
      try {
        setLoadingAttendance(true);
        setErrorMessage("");
        setSaveSuccess("");
        const res = await fetch(`/api/attendance?classId=${selectedClassId}&date=${selectedDate}`);
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to load class attendance.");
        }
        const data = await res.json();
        setStudents(data.students || []);
        setIsAlreadyMarked(data.isAlreadyMarked || false);
      } catch (err: unknown) {
        const e = err as Error;
        setErrorMessage(e.message || "Failed to load attendance list.");
      } finally {
        setLoadingAttendance(false);
      }
    }

    loadClassAttendance();
  }, [selectedClassId, selectedDate]);

  // Set student status
  function handleStatusChange(studentId: string, status: "present" | "absent") {
    startTransition(() => {
      setStudents((prev) =>
        prev.map((s) => (s._id === studentId ? { ...s, status } : s))
      );
      setSaveSuccess("");
    });
  }

  // Fast action: Mark All Present
  function handleMarkAllPresent() {
    startTransition(() => {
      setStudents((prev) => prev.map((s) => ({ ...s, status: "present" })));
      setSaveSuccess("");
    });
  }

  // Action: Clear / Reset to unmarked
  function handleReset() {
    startTransition(() => {
      setStudents((prev) => prev.map((s) => ({ ...s, status: null })));
      setSaveSuccess("");
    });
  }

  // Save Attendance to Backend
  async function handleSaveAttendance() {
    setErrorMessage("");
    setSaveSuccess("");

    if (!selectedClassId || !selectedDate) {
      setErrorMessage("Please select a valid class and date.");
      return;
    }

    if (students.length === 0) {
      setErrorMessage("No active students found in this class to mark.");
      return;
    }

    // Validation: ensure every student has a marked status
    const unmarked = students.filter((s) => s.status === null);
    if (unmarked.length > 0) {
      setErrorMessage(
        `Please mark attendance for all students. ${unmarked.length} student${
          unmarked.length > 1 ? "s are" : " is"
        } still unmarked.`
      );
      return;
    }

    try {
      setSaving(true);
      const payload = {
        classId: selectedClassId,
        date: selectedDate,
        records: students.map((s) => ({
          studentId: s._id,
          status: s.status as "present" | "absent",
        })),
      };

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Attendance could not be saved. Please try again.");
      }

      setIsAlreadyMarked(true);
      setSaveSuccess(data.message || "Attendance saved successfully!");
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(e.message || "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  }

  // Calculated Counters
  const presentCount = students.filter((s) => s.status === "present").length;
  const absentCount = students.filter((s) => s.status === "absent").length;
  const unmarkedCount = students.filter((s) => s.status === null).length;
  const totalCount = students.length;

  const currentClass = classes.find((c) => c._id === selectedClassId);

  // Filtered view by search
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.fatherName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <AppShell title="Take Attendance">
      <div className="space-y-6">
        {/* Top Control Bar: Class Selector, Date Picker, Quick Status */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            {/* Class and Date Selectors */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Class Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Class
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    disabled={loadingClasses}
                    className="block w-full sm:w-48 pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  >
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        Class {cls.className}-{cls.section} ({cls.studentCount ?? 0})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Attendance Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="block w-full sm:w-44 pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Status Badge */}
              <div className="sm:self-end pt-1">
                {isAlreadyMarked ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Records Saved (Editing Mode)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Not Yet Saved</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Batch Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                disabled={students.length === 0 || loadingAttendance}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/25 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Mark All Present</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={students.length === 0 || loadingAttendance}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-semibold transition-all active:scale-95"
                title="Reset all to unmarked"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={saving || students.length === 0 || loadingAttendance}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/30 transition-all hover:shadow-indigo-600/50 active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Save Attendance"}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
            <div className="flex items-center gap-4">
              <span className="text-slate-500">
                Total: <strong className="text-slate-800">{totalCount}</strong>
              </span>
              <span className="text-emerald-600">
                Present: <strong>{presentCount}</strong>
              </span>
              <span className="text-red-600">
                Absent: <strong>{absentCount}</strong>
              </span>
              <span className="text-amber-600">
                Unmarked: <strong>{unmarkedCount}</strong>
              </span>
            </div>

            {/* In-page live search */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student or roll #..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Feedback alerts */}
        {saveSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-semibold flex items-center gap-3 animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-sm font-semibold flex items-center gap-3 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Attendance Student Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {loadingAttendance ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              Loading students for Class {currentClass?.className}-{currentClass?.section}...
            </div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-bold text-slate-700">No active students in this class</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Add students to Class {currentClass?.className}-{currentClass?.section} from the Students tab to start taking attendance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 md:px-6 w-20">Roll No.</th>
                    <th className="py-3.5 px-4 md:px-6">Student Name</th>
                    <th className="py-3.5 px-4 md:px-6 hidden sm:table-cell">Father Name</th>
                    <th className="py-3.5 px-4 md:px-6 text-center w-72">Attendance Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((stu) => {
                    const isPresent = stu.status === "present";
                    const isAbsent = stu.status === "absent";
                    const isNeutral = stu.status === null;

                    return (
                      <tr
                        key={stu._id}
                        className={`transition-colors ${
                          isPresent
                            ? "bg-emerald-50/30 hover:bg-emerald-50/60"
                            : isAbsent
                            ? "bg-red-50/30 hover:bg-red-50/60"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        {/* Roll Number */}
                        <td className="py-3.5 px-4 md:px-6 font-mono font-bold text-slate-700">
                          {stu.rollNumber}
                        </td>

                        {/* Student Name */}
                        <td className="py-3.5 px-4 md:px-6">
                          <div className="font-bold text-slate-900">{stu.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono sm:hidden">
                            {stu.studentId}
                          </div>
                        </td>

                        {/* Father Name */}
                        <td className="py-3.5 px-4 md:px-6 text-slate-600 hidden sm:table-cell text-xs">
                          {stu.fatherName}
                        </td>

                        {/* Fast Attendance Toggle Buttons */}
                        <td className="py-3.5 px-4 md:px-6">
                          <div className="flex items-center justify-center gap-2">
                            {/* Present Button */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(stu._id, "present")}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                isPresent
                                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-600 scale-[1.02]"
                                  : "bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Present</span>
                            </button>

                            {/* Absent Button */}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(stu._id, "absent")}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                                isAbsent
                                  ? "bg-red-600 text-white shadow-md shadow-red-600/30 border border-red-600 scale-[1.02]"
                                  : "bg-red-50/70 hover:bg-red-100 text-red-800 border border-red-200"
                              }`}
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Absent</span>
                            </button>

                            {/* Status indicator badge */}
                            <div className="hidden lg:block w-20 text-center">
                              {isNeutral ? (
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                  Not Marked
                                </span>
                              ) : isPresent ? (
                                <span className="inline-block text-[11px] font-extrabold text-emerald-600">
                                  P
                                </span>
                              ) : (
                                <span className="inline-block text-[11px] font-extrabold text-red-600">
                                  A
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Bottom Save Bar */}
          {students.length > 0 && (
            <div className="p-4 md:px-6 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                <span>
                  {unmarkedCount > 0 ? (
                    <span className="text-amber-600 font-semibold">
                      {unmarkedCount} student(s) still not marked.
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">
                      All {totalCount} students marked ({presentCount} Present, {absentCount} Absent).
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={saving || loadingAttendance}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/30 transition-all hover:shadow-indigo-600/50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving Attendance..." : "Save Attendance"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
