import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Student } from "@/lib/models/Student";
import { Attendance } from "@/lib/models/Attendance";
import { getCurrentUser } from "@/lib/auth/jwt";
import { calculateAttendancePercentage } from "@/lib/calculations/attendance";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // e.g. "2026-09"
    const year = searchParams.get("year"); // e.g. "2026"

    const student = await Student.findById(id).populate("classId", "className section");
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Attendance query with optional period filtering
    const attendanceFilter: Record<string, unknown> = { studentId: id };
    if (month) {
      attendanceFilter.date = { $regex: `^${month}` };
    } else if (year) {
      attendanceFilter.date = { $regex: `^${year}` };
    }

    const attendanceRecords = await Attendance.find(attendanceFilter)
      .sort({ date: -1 })
      .lean();

    const presentCount = attendanceRecords.filter((r) => r.status === "present").length;
    const absentCount = attendanceRecords.filter((r) => r.status === "absent").length;
    const totalMarkedDays = presentCount + absentCount;
    const percentage = calculateAttendancePercentage(presentCount, absentCount);

    return NextResponse.json({
      success: true,
      student,
      summary: {
        presentCount,
        absentCount,
        totalMarkedDays,
        percentage,
      },
      history: attendanceRecords,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Student GET by ID error:", err);
    return NextResponse.json({ error: "Failed to fetch student details." }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const { name, fatherName, rollNumber, classId, active } = body;

    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (rollNumber && classId) {
      const existingRoll = await Student.findOne({
        _id: { $ne: id },
        classId,
        rollNumber: String(rollNumber).trim(),
        active: true,
      });

      if (existingRoll) {
        return NextResponse.json(
          { error: `Roll number ${rollNumber} is already in use by another student in this class.` },
          { status: 409 }
        );
      }
    }

    if (name) student.name = String(name).trim();
    if (fatherName) student.fatherName = String(fatherName).trim();
    if (rollNumber) student.rollNumber = String(rollNumber).trim();
    if (classId) student.classId = classId;
    if (typeof active === "boolean") student.active = active;

    await student.save();
    const updated = await Student.findById(id).populate("classId", "className section");

    return NextResponse.json({
      success: true,
      message: "Student updated successfully.",
      student: updated,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Student PUT error:", err);
    return NextResponse.json({ error: "Failed to update student." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const student = await Student.findById(id);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check if attendance exists
    const attendanceCount = await Attendance.countDocuments({ studentId: id });
    if (attendanceCount > 0) {
      // Safely deactivate rather than wiping historical attendance data
      student.active = false;
      await student.save();
      return NextResponse.json({
        success: true,
        message: `Student "${student.name}" has been deactivated to preserve their ${attendanceCount} historical attendance records.`,
      });
    }

    // No attendance exists, safe to delete completely
    await Student.findByIdAndDelete(id);
    return NextResponse.json({
      success: true,
      message: `Student "${student.name}" deleted successfully.`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Student DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete student." }, { status: 500 });
  }
}
