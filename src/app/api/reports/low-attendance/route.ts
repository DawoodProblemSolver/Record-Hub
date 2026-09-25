import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Student } from "@/lib/models/Student";
import { Attendance } from "@/lib/models/Attendance";
import { getCurrentUser } from "@/lib/auth/jwt";
import { calculateAttendancePercentage } from "@/lib/calculations/attendance";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const thresholdParam = searchParams.get("threshold");
    const threshold = thresholdParam ? parseFloat(thresholdParam) : 75;
    const classId = searchParams.get("classId");
    const month = searchParams.get("month"); // optional

    const studentFilter: Record<string, unknown> = { active: true };
    if (classId) {
      studentFilter.classId = classId;
    }

    const students = await Student.find(studentFilter)
      .populate("classId", "className section")
      .lean();

    const lowAttendanceStudents = [];

    for (const stu of students) {
      const attendanceFilter: Record<string, unknown> = { studentId: stu._id };
      if (month) {
        attendanceFilter.date = { $regex: `^${month}` };
      }

      const records = await Attendance.find(attendanceFilter).lean();
      const presentCount = records.filter((r) => r.status === "present").length;
      const absentCount = records.filter((r) => r.status === "absent").length;
      const totalDays = presentCount + absentCount;

      // Only check if student has at least 1 marked attendance record
      if (totalDays > 0) {
        const percentage = calculateAttendancePercentage(presentCount, absentCount);
        if (percentage < threshold) {
          const cls = stu.classId as unknown as { className: string; section: string };
          lowAttendanceStudents.push({
            studentId: stu._id,
            systemId: stu.studentId,
            name: stu.name,
            fatherName: stu.fatherName,
            rollNumber: stu.rollNumber,
            className: cls ? cls.className : "N/A",
            section: cls ? cls.section : "N/A",
            presentCount,
            absentCount,
            totalDays,
            percentage,
          });
        }
      }
    }

    // Sort by lowest percentage first
    lowAttendanceStudents.sort((a, b) => a.percentage - b.percentage);

    return NextResponse.json({
      success: true,
      threshold,
      count: lowAttendanceStudents.length,
      students: lowAttendanceStudents,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Low attendance report error:", err);
    return NextResponse.json(
      { error: "Failed to generate low attendance report." },
      { status: 500 }
    );
  }
}
