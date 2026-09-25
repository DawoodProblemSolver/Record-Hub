import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Student } from "@/lib/models/Student";
import { Class } from "@/lib/models/Class";
import { Attendance } from "@/lib/models/Attendance";
import { getCurrentUser } from "@/lib/auth/jwt";
import { calculateAttendancePercentage, getTodayDateString } from "@/lib/calculations/attendance";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    const today = getTodayDateString();

    // 1. Total counts
    const totalStudents = await Student.countDocuments({ active: true });
    const totalClasses = await Class.countDocuments();

    // 2. Today's attendance
    const todayRecords = await Attendance.find({ date: today }).lean();
    const todayPresent = todayRecords.filter((r) => r.status === "present").length;
    const todayAbsent = todayRecords.filter((r) => r.status === "absent").length;
    const todayTotalMarked = todayPresent + todayAbsent;
    const todayPercentage = calculateAttendancePercentage(todayPresent, todayAbsent);

    // 3. Class-by-class today status
    const classes = await Class.find().sort({ className: 1, section: 1 }).lean();
    const classSummaries = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await Student.countDocuments({ classId: cls._id, active: true });
        const classTodayRecords = todayRecords.filter(
          (r) => r.classId.toString() === cls._id.toString()
        );
        const present = classTodayRecords.filter((r) => r.status === "present").length;
        const absent = classTodayRecords.filter((r) => r.status === "absent").length;
        const marked = present + absent;
        const pct = calculateAttendancePercentage(present, absent);

        return {
          classId: cls._id,
          className: cls.className,
          section: cls.section,
          totalStudents: studentCount,
          markedCount: marked,
          presentCount: present,
          absentCount: absent,
          percentage: pct,
          isCompleted: marked >= studentCount && studentCount > 0,
        };
      })
    );

    // 4. Students with low attendance (< 75%)
    const lowAttendanceThreshold = 75;
    const activeStudents = await Student.find({ active: true })
      .populate("classId", "className section")
      .lean();

    const lowStudents = [];
    for (const stu of activeStudents) {
      const stuRecords = await Attendance.find({ studentId: stu._id }).lean();
      const p = stuRecords.filter((r) => r.status === "present").length;
      const a = stuRecords.filter((r) => r.status === "absent").length;
      const tot = p + a;
      if (tot > 0) {
        const pct = calculateAttendancePercentage(p, a);
        if (pct < lowAttendanceThreshold) {
          const cls = stu.classId as unknown as { className: string; section: string };
          lowStudents.push({
            studentId: stu._id,
            name: stu.name,
            rollNumber: stu.rollNumber,
            className: cls ? `${cls.className}-${cls.section}` : "N/A",
            percentage: pct,
            present: p,
            absent: a,
          });
        }
      }
    }
    lowStudents.sort((a, b) => a.percentage - b.percentage);

    // 5. Recent attendance activity
    const recentActivity = await Attendance.find()
      .populate("studentId", "name rollNumber")
      .populate("classId", "className section")
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean();

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        totalClasses,
        todayPresent,
        todayAbsent,
        todayTotalMarked,
        todayPercentage,
        todayDate: today,
      },
      classSummaries,
      lowAttendanceCount: lowStudents.length,
      lowAttendanceList: lowStudents.slice(0, 5),
      recentActivity,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Dashboard GET error:", err);
    return NextResponse.json({ error: "Failed to load dashboard data." }, { status: 500 });
  }
}
