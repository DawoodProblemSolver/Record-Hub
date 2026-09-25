"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import {
  GraduationCap,
  Plus,
  Users,
  Calendar,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";

interface ClassItem {
  _id: string;
  className: string;
  section: string;
  studentCount?: number;
  createdAt: string;
}

interface StudentInClass {
  _id: string;
  studentId: string;
  name: string;
  fatherName: string;
  rollNumber: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [classNameInput, setClassNameInput] = useState("");
  const [sectionInput, setSectionInput] = useState("");
  const [savingClass, setSavingClass] = useState(false);

  // View Students Modal
  const [viewingClass, setViewingClass] = useState<ClassItem | null>(null);
  const [classStudents, setClassStudents] = useState<StudentInClass[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  async function loadClasses() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/classes");
      if (!res.ok) throw new Error("Failed to load classes");
      const data = await res.json();
      setClasses(data.classes || []);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Unable to load classes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClasses();
  }, []);

  function openCreateModal() {
    setEditingClass(null);
    setClassNameInput("");
    setSectionInput("");
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  function openEditModal(cls: ClassItem) {
    setEditingClass(cls);
    setClassNameInput(cls.className);
    setSectionInput(cls.section);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  async function handleSaveClass(e: React.FormEvent) {
    e.preventDefault();
    if (!classNameInput.trim() || !sectionInput.trim()) {
      setError("Please fill in both Class Name and Section.");
      return;
    }

    try {
      setSavingClass(true);
      setError("");

      const url = editingClass ? `/api/classes/${editingClass._id}` : "/api/classes";
      const method = editingClass ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className: classNameInput.trim(),
          section: sectionInput.trim().toUpperCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save class.");
      }

      setSuccess(data.message || "Class saved successfully!");
      setIsModalOpen(false);
      loadClasses();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "An error occurred while saving the class.");
    } finally {
      setSavingClass(false);
    }
  }

  async function handleDeleteClass(cls: ClassItem) {
    if (!confirm(`Are you sure you want to delete Class ${cls.className}-${cls.section}?`)) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      const res = await fetch(`/api/classes/${cls._id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete class.");
      }

      setSuccess(data.message || "Class deleted successfully.");
      loadClasses();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Cannot delete class.");
    }
  }

  async function handleViewClassStudents(cls: ClassItem) {
    try {
      setViewingClass(cls);
      setLoadingStudents(true);
      const res = await fetch(`/api/classes/${cls._id}`);
      if (res.ok) {
        const data = await res.json();
        setClassStudents(data.students || []);
      }
    } catch (err) {
      console.error("Failed to load class students:", err);
    } finally {
      setLoadingStudents(false);
    }
  }

  return (
    <AppShell title="Class Management">
      <div className="space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Active Classes &amp; Sections</h2>
            <p className="text-xs text-slate-500 mt-1">
              Organize students into distinct grades and sections for attendance tracking.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Class</span>
          </button>
        </div>

        {/* Feedback alerts */}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess("")} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError("")} className="text-red-700 hover:text-red-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Classes Grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs p-8">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No classes created yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create your first class (e.g. 9-A or Grade 10) to begin adding students.
            </p>
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500"
            >
              <Plus className="w-4 h-4" />
              <span>Create Class</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.map((cls) => (
              <div
                key={cls._id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg shadow-inner">
                        {cls.className}-{cls.section}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Class {cls.className}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500">
                          Section {cls.section}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(cls)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit class"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete class"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Student Count */}
                  <div className="mt-5 p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Enrolled Students</span>
                    </div>
                    <span className="font-bold text-slate-800 text-sm">
                      {cls.studentCount ?? 0}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleViewClassStudents(cls)}
                    className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>View Students</span>
                  </button>

                  <Link
                    href={`/attendance?classId=${cls._id}`}
                    className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                    title="Take class attendance"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Roll Call</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Create / Edit Class */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-800">
                  {editingClass ? "Edit Class" : "Create New Class"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveClass} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Class Name / Grade
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9 or 10 or Grade 9"
                    value={classNameInput}
                    onChange={(e) => setClassNameInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Section
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A, B, Blue"
                    value={sectionInput}
                    onChange={(e) => setSectionInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white uppercase"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingClass}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25"
                  >
                    {savingClass ? "Saving..." : editingClass ? "Update Class" : "Create Class"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: View Students in Class */}
        {viewingClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in duration-150 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    Class {viewingClass.className}-{viewingClass.section} Students
                  </h3>
                  <p className="text-xs text-slate-500">
                    {classStudents.length} active students enrolled
                  </p>
                </div>
                <button
                  onClick={() => setViewingClass(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-2">
                {loadingStudents ? (
                  <div className="py-8 text-center text-xs text-slate-500">Loading student roster...</div>
                ) : classStudents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No students currently assigned to this class.
                  </div>
                ) : (
                  classStudents.map((stu) => (
                    <div
                      key={stu._id}
                      className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          #{stu.rollNumber}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">{stu.name}</p>
                          <p className="text-slate-500 text-[11px]">S/O {stu.fatherName}</p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{stu.studentId}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/students?classId=${viewingClass._id}`}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <span>Manage in Students Tab</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => setViewingClass(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
