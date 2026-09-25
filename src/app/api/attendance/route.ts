import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Attendance } from "@/lib/models/Attendance";
import { Student } from "@/lib/models/Student";
import { Class } from "@/lib/models/Class";
import { getCurrentUser } from "@/lib/auth/jwt";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const date = searchParams.get("date"); // YYYY-MM-DD
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const month = searchParams.get("month"); // e.g. 2026-09
    const year = searchParams.get("year");

    // Case 1: Taking attendance for a specific class on a specific date
    if (classId && date) {
      const cls = await Class.findById(classId);
      if (!cls) {
        return NextResponse.json({ error: "Class not found." }, { status: 404 });
      }

      // Fetch all active students in this class
      const students = await Student.find({ classId, active: true })
        .sort({ rollNumber: 1, name: 1 })
        .lean();

      // Fetch any existing attendance for this class and date
      const existingRecords = await Attendance.find({ classId, date }).lean();
      const attendanceMap = new Map<string, string>();
      for (const rec of existingRecords) {
        attendanceMap.set(rec.studentId.toString(), rec.status);
      }

      // Merge records
      const studentAttendanceList = students.map((stu) => {
        const markedStatus = attendanceMap.get(stu._id.toString()) || null;
        return {
          _id: stu._id,
          studentId: stu.studentId,
          name: stu.name,
          fatherName: stu.fatherName,
          rollNumber: stu.rollNumber,
          classId: stu.classId,
          status: markedStatus, // "present" | "absent" | null (not marked)
        };
      });

      const isAlreadyMarked = existingRecords.length > 0;
      const presentCount = existingRecords.filter((r) => r.status === "present").length;
      const absentCount = existingRecords.filter((r) => r.status === "absent").length;

      return NextResponse.json({
        success: true,
        class: cls,
        date,
        isAlreadyMarked,
        presentCount,
        absentCount,
        totalStudents: students.length,
        students: studentAttendanceList,
      });
    }

    // Case 2: General Attendance History Search & Filtering
    const filter: Record<string, unknown> = {};
    if (classId) filter.classId = classId;
    if (studentId) filter.studentId = studentId;
    if (status) filter.status = status;

    if (date) {
      filter.date = date;
    } else if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    } else if (month) {
      filter.date = { $regex: `^${month}` };
    } else if (year) {
      filter.date = { $regex: `^${year}` };
    }

    const records = await Attendance.find(filter)
      .populate("studentId", "name studentId rollNumber fatherName")
      .populate("classId", "className section")
      .sort({ date: -1, createdAt: -1 })
      .limit(500)
      .lean();

    return NextResponse.json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Attendance GET error:", err);
    return NextResponse.json({ error: "Failed to fetch attendance data." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { classId, date, records } = body;

    if (!classId || !date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "Class ID, Date, and attendance records array are required." },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const cls = await Class.findById(classId);
    if (!cls) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: "No student records provided to save." },
        { status: 400 }
      );
    }

    // Step 1: Validate every student has a marked status ("present" or "absent")
    for (const item of records) {
      if (!item.studentId) {
        return NextResponse.json(
          { error: "Missing student ID in attendance record." },
          { status: 400 }
        );
      }
      if (item.status !== "present" && item.status !== "absent") {
        return NextResponse.json(
          {
            error: "All students must have attendance marked as either Present or Absent before saving.",
          },
          { status: 400 }
        );
      }
    }

    // Step 2: Bulk upsert to MongoDB (prevents duplicates and updates existing records seamlessly)
    const bulkOps = records.map((item) => ({
      updateOne: {
        filter: {
          studentId: item.studentId,
          date: date,
        },
        update: {
          $set: {
            studentId: item.studentId,
            classId: classId,
            date: date,
            status: item.status,
            markedBy: user.name || "Teacher",
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await Attendance.bulkWrite(bulkOps as any);

    const presentCount = records.filter((r) => r.status === "present").length;
    const absentCount = records.filter((r) => r.status === "absent").length;

    return NextResponse.json({
      success: true,
      message: `Attendance saved successfully for ${cls.className}-${cls.section} — ${date}.`,
      summary: {
        className: `${cls.className}-${cls.section}`,
        date,
        totalMarked: records.length,
        presentCount,
        absentCount,
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Attendance POST error:", err);
    return NextResponse.json(
      { error: "Attendance could not be saved. Please try again." },
      { status: 500 }
    );
  }
}
