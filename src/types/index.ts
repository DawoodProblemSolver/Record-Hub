export interface IUser {
  _id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: "admin" | "teacher";
  createdAt: string;
  updatedAt: string;
}

export interface IClass {
  _id: string;
  className: string;
  section: string;
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IStudent {
  _id: string;
  studentId: string;
  name: string;
  fatherName: string;
  rollNumber: string;
  classId: string | IClass;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = "present" | "absent";

export interface IAttendance {
  _id: string;
  studentId: string | IStudent;
  classId: string | IClass;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  markedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecordPayload {
  studentId: string;
  status: AttendanceStatus;
}

export interface AttendanceSaveRequest {
  classId: string;
  date: string;
  records: AttendanceRecordPayload[];
}

export interface StudentAttendanceSummary {
  studentId: string;
  studentName: string;
  rollNumber: string;
  className: string;
  section: string;
  presentCount: number;
  absentCount: number;
  totalDays: number;
  percentage: number;
}

export interface ClassAttendanceSummary {
  classId: string;
  className: string;
  section: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  percentage: number;
  date?: string;
}

export interface LowAttendanceStudent {
  studentId: string;
  name: string;
  fatherName: string;
  rollNumber: string;
  className: string;
  section: string;
  presentCount: number;
  absentCount: number;
  totalDays: number;
  percentage: number;
}
