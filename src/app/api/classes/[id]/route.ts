import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Class } from "@/lib/models/Class";
import { Student } from "@/lib/models/Student";
import { Attendance } from "@/lib/models/Attendance";
import { getCurrentUser } from "@/lib/auth/jwt";

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
    const cls = await Class.findById(id);
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const students = await Student.find({ classId: id, active: true }).sort({ rollNumber: 1 });
    return NextResponse.json({ success: true, class: cls, students });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Class GET by ID error:", err);
    return NextResponse.json({ error: "Failed to fetch class." }, { status: 500 });
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
    const { className, section } = body;

    if (!className || !section) {
      return NextResponse.json(
        { error: "Class name and section are required." },
        { status: 400 }
      );
    }

    const cleanClassName = className.trim();
    const cleanSection = section.trim().toUpperCase();

    // Check duplicate with another class ID
    const duplicate = await Class.findOne({
      _id: { $ne: id },
      className: new RegExp(`^${cleanClassName}$`, "i"),
      section: new RegExp(`^${cleanSection}$`, "i"),
    });

    if (duplicate) {
      return NextResponse.json(
        { error: `Another class ${cleanClassName}-${cleanSection} already exists.` },
        { status: 409 }
      );
    }

    const updated = await Class.findByIdAndUpdate(
      id,
      { className: cleanClassName, section: cleanSection },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Class updated successfully.",
      class: updated,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Class PUT error:", err);
    return NextResponse.json({ error: "Failed to update class." }, { status: 500 });
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

    // Safety check: verify if active students or attendance records exist
    const studentCount = await Student.countDocuments({ classId: id, active: true });
    if (studentCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete class. There are currently ${studentCount} active students enrolled. Please reassign or deactivate the students first.`,
        },
        { status: 400 }
      );
    }

    const attendanceCount = await Attendance.countDocuments({ classId: id });
    if (attendanceCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete class. There are ${attendanceCount} historical attendance records associated with it to preserve data integrity.`,
        },
        { status: 400 }
      );
    }

    const deleted = await Class.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Class not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Class deleted successfully." });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Class DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete class." }, { status: 500 });
  }
}
