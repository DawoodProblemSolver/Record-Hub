import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Student } from "@/lib/models/Student";
import { Attendance } from "@/lib/models/Attendance";
import { getCurrentUser } from "@/lib/auth/jwt";
import { calculateAttendancePercentage, getTodayDateString } from "@/lib/calculations/attendance";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const today = getTodayDateString();
    const month = searchParams.get("month") || today.substring(0, 7); // YYYY-MM e.g. 2026-09
    const classId = searchParams.get("classId");

    const studentFilter: Record<string, unknown> = { active: true };
    if (classId) {
      studentFilter.classId = classId;
    }

    const students = await Student.find(studentFilter)
      .populate("classId", "className section")
      .sort({ rollNumber: 1, name: 1 })
      .lean();

    const report = await Promise.all(
      students.map(async (stu) => {
        const records = await Attendance.find({
          studentId: stu._id,
          date: { $regex: `^${month}` },
        }).lean();

        const presentCount = records.filter((r) => r.status === "present").length;
        const absentCount = records.filter((r) => r.status === "absent").length;
        const totalDays = presentCount + absentCount;
        const percentage = calculateAttendancePercentage(presentCount, absentCount);

        const cls = stu.classId as unknown as { className: string; section: string };

        return {
          studentId: stu._id,
          systemId: stu.studentId,
          name: stu.name,
          fatherName: stu.fatherName,
          rollNumber: stu.rollNumber,
          className: cls ? cls.className : "N/A",
          section: cls ? cls.section : "N/A",
          month,
          presentCount,
          absentCount,
          totalDays,
          percentage,
        };
      })
    );

    return NextResponse.json({
      success: true,
      month,
      count: report.length,
      report,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Monthly report error:", err);
    return NextResponse.json({ error: "Failed to generate monthly report." }, { status: 500 });
  }
}
