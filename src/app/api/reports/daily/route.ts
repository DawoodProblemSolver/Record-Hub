import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Class } from "@/lib/models/Class";
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
    const date = searchParams.get("date") || getTodayDateString();
    const classId = searchParams.get("classId");

    const classFilter: Record<string, unknown> = {};
    if (classId) {
      classFilter._id = classId;
    }

    const classes = await Class.find(classFilter).sort({ className: 1, section: 1 }).lean();

    const report = await Promise.all(
      classes.map(async (cls) => {
        const totalStudents = await Student.countDocuments({ classId: cls._id, active: true });
        const records = await Attendance.find({ classId: cls._id, date }).lean();

        const presentCount = records.filter((r) => r.status === "present").length;
        const absentCount = records.filter((r) => r.status === "absent").length;
        const totalMarked = presentCount + absentCount;
        const percentage = calculateAttendancePercentage(presentCount, absentCount);

        return {
          classId: cls._id,
          className: cls.className,
          section: cls.section,
          date,
          totalStudents,
          totalMarked,
          presentCount,
          absentCount,
          percentage,
          isMarked: totalMarked > 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      date,
      report,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Daily report error:", err);
    return NextResponse.json({ error: "Failed to generate daily report." }, { status: 500 });
  }
}
