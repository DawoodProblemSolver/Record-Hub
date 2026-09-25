"use client";

import { useEffect, useState, useTransition } from "react";
import AppShell from "@/components/AppShell";
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Calendar,
  Percent,
} from "lucide-react";

interface ClassOption {
  _id: string;
  className: string;
  section: string;
}

interface StudentItem {
  _id: string;
  studentId: string;
  name: string;
  fatherName: string;
  rollNumber: string;
  classId: { _id: string; className: string; section: string };
  active: boolean;
  createdAt: string;
}

interface StudentProfileData {
  student: StudentItem;
  summary: {
    presentCount: number;
    absentCount: number;
    totalMarkedDays: number;
    percentage: number;
  };
  history: Array<{
    _id: string;
    date: string;
    status: "present" | "absent";
  }>;
}

export default function StudentsPage() {
  const [, startTransition] = useTransition();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create / Edit Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [formData, setFormData] = useState({
    studentId: "",
    name: "",
    fatherName: "",
    rollNumber: "",
    classId: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Student Profile Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

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
        console.error("Failed to load classes:", err);
      }
    }
    loadClasses();
  }, []);

  // Load Students with filters
  async function loadStudents() {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (selectedClassFilter) params.set("classId", selectedClassFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/students?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load students.");
      const json = await res.json();
      setStudents(json.students || []);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedClassFilter, searchQuery]);

  function openCreateModal() {
    setEditingStudent(null);
    setFormData({
      studentId: `STU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: "",
      fatherName: "",
      rollNumber: "",
      classId: classes[0]?._id || "",
    });
    setError("");
    setSuccess("");
    setIsFormModalOpen(true);
  }

  function openEditModal(stu: StudentItem) {
    setEditingStudent(stu);
    setFormData({
      studentId: stu.studentId,
      name: stu.name,
      fatherName: stu.fatherName,
      rollNumber: stu.rollNumber,
      classId: stu.classId?._id || "",
    });
    setError("");
    setSuccess("");
    setIsFormModalOpen(true);
  }

  async function handleSaveStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.fatherName || !formData.rollNumber || !formData.classId) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setFormSubmitting(true);
      setError("");

      const url = editingStudent ? `/api/students/${editingStudent._id}` : "/api/students";
      const method = editingStudent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save student.");
      }

      setSuccess(data.message || "Student saved successfully!");
      setIsFormModalOpen(false);
      loadStudents();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Error saving student.");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDeleteStudent(stu: StudentItem) {
    if (!confirm(`Are you sure you want to deactivate or remove student "${stu.name}"?`)) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      const res = await fetch(`/api/students/${stu._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove student.");
      setSuccess(data.message || "Student removed.");
      loadStudents();
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Unable to remove student.");
    }
  }

  // View Student Profile & Attendance History
  async function handleViewProfile(stu: StudentItem) {
    try {
      setLoadingProfile(true);
      setProfileModalOpen(true);
      const res = await fetch(`/api/students/${stu._id}`);
      if (!res.ok) throw new Error("Failed to load student profile");
      const json = await res.json();
      setProfileData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProfile(false);
    }
  }

  return (
    <AppShell title="Student Directory">
      <div className="space-y-6">
        {/* Top Control Bar */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name, roll number, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* Class Filter Dropdown */}
            <div className="sm:w-56">
              <div className="relative">
                <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
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
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
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

        {/* Students Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-sm">Loading student directory...</div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No students found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedClassFilter
                  ? "No students match your active search and filter criteria."
                  : "Start enrolling students to manage attendance and records."}
              </p>
              <button
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4 md:px-6">Roll No.</th>
                    <th className="py-3.5 px-4 md:px-6">Student Name</th>
                    <th className="py-3.5 px-4 md:px-6">Father Name</th>
                    <th className="py-3.5 px-4 md:px-6">Class</th>
                    <th className="py-3.5 px-4 md:px-6">Student ID</th>
                    <th className="py-3.5 px-4 md:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((stu) => (
                    <tr key={stu._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 md:px-6 font-mono font-bold text-slate-700">
                        #{stu.rollNumber}
                      </td>
                      <td className="py-3.5 px-4 md:px-6">
                        <button
                          onClick={() => handleViewProfile(stu)}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-left transition-colors"
                        >
                          {stu.name}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 md:px-6 text-slate-600 text-xs">{stu.fatherName}</td>
                      <td className="py-3.5 px-4 md:px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {stu.classId ? `${stu.classId.className}-${stu.classId.section}` : "N/A"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 md:px-6 font-mono text-xs text-slate-500">
                        {stu.studentId}
                      </td>
                      <td className="py-3.5 px-4 md:px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewProfile(stu)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View attendance profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(stu)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(stu)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Deactivate / remove student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Add / Edit Student */}
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-800">
                  {editingStudent ? "Edit Student Information" : "Enroll New Student"}
                </h3>
                <button
                  onClick={() => setIsFormModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStudent} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ali Khan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Father&apos;s Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Khan"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 01"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Assign Class
                    </label>
                    <select
                      value={formData.classId}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      required
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    >
                      <option value="">Select class...</option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.className}-{cls.section}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25"
                  >
                    {formSubmitting ? "Saving..." : editingStudent ? "Update Student" : "Save Student"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Student Profile & Detailed Attendance History */}
        {profileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in duration-150 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base">
                    {profileData?.student?.name ? profileData.student.name[0] : "S"}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {profileData?.student?.name || "Student Profile"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Roll #{profileData?.student?.rollNumber} • Class{" "}
                      {profileData?.student?.classId?.className}-{profileData?.student?.classId?.section}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setProfileModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingProfile ? (
                <div className="py-16 text-center text-xs text-slate-500">Loading student history...</div>
              ) : profileData ? (
                <div className="flex-1 overflow-y-auto py-4 space-y-5">
                  {/* Attendance Summary Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                        Present Days
                      </p>
                      <p className="text-2xl font-black text-emerald-700 mt-1">
                        {profileData.summary.presentCount}
                      </p>
                    </div>

                    <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-red-800 uppercase tracking-wider">
                        Absent Days
                      </p>
                      <p className="text-2xl font-black text-red-700 mt-1">
                        {profileData.summary.absentCount}
                      </p>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
                        Attendance %
                      </p>
                      <p className="text-2xl font-black text-indigo-700 mt-1">
                        {profileData.summary.percentage}%
                      </p>
                    </div>
                  </div>

                  {/* Attendance Log Timeline */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                      Recorded Attendance History ({profileData.summary.totalMarkedDays} marked days)
                    </h4>
                    {profileData.history.length === 0 ? (
                      <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                        No attendance marked yet for this student.
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                        {profileData.history.map((rec) => (
                          <div
                            key={rec._id}
                            className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl text-xs transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-semibold text-slate-700">{rec.date}</span>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                rec.status === "present"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-red-100 text-red-800 border border-red-200"
                              }`}
                            >
                              {rec.status === "present" ? "Present" : "Absent"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setProfileModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
