import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Class } from "@/lib/models/Class";
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
    const classId = searchParams.get("classId");
    const sortBy = searchParams.get("sortBy") || "percentage_asc"; // "percentage_asc", "percentage_desc", "rollNumber"
    const month = searchParams.get("month"); // optional YYYY-MM

    if (!classId) {
      return NextResponse.json({ error: "classId parameter is required." }, { status: 400 });
    }

    const cls = await Class.findById(classId);
    if (!cls) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    const students = await Student.find({ classId, active: true }).sort({ rollNumber: 1 }).lean();

    const report = await Promise.all(
      students.map(async (stu) => {
        const attendanceFilter: Record<string, unknown> = { studentId: stu._id };
        if (month) {
          attendanceFilter.date = { $regex: `^${month}` };
        }

        const records = await Attendance.find(attendanceFilter).lean();
        const presentCount = records.filter((r) => r.status === "present").length;
        const absentCount = records.filter((r) => r.status === "absent").length;
        const totalDays = presentCount + absentCount;
        const percentage = calculateAttendancePercentage(presentCount, absentCount);

        return {
          studentId: stu._id,
          systemId: stu.studentId,
          name: stu.name,
          fatherName: stu.fatherName,
          rollNumber: stu.rollNumber,
          presentCount,
          absentCount,
          totalDays,
          percentage,
        };
      })
    );

    // Apply sorting
    if (sortBy === "percentage_asc") {
      report.sort((a, b) => a.percentage - b.percentage);
    } else if (sortBy === "percentage_desc") {
      report.sort((a, b) => b.percentage - a.percentage);
    } else if (sortBy === "rollNumber") {
      report.sort((a, b) => (parseInt(a.rollNumber) || 0) - (parseInt(b.rollNumber) || 0));
    }

    // Calculate class average
    const totalClassPresent = report.reduce((sum, s) => sum + s.presentCount, 0);
    const totalClassAbsent = report.reduce((sum, s) => sum + s.absentCount, 0);
    const classAveragePercentage = calculateAttendancePercentage(totalClassPresent, totalClassAbsent);

    return NextResponse.json({
      success: true,
      class: cls,
      studentCount: students.length,
      classAveragePercentage,
      report,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Class report error:", err);
    return NextResponse.json({ error: "Failed to generate class report." }, { status: 500 });
  }
}
