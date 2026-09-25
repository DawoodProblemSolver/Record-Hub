import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
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
    const search = searchParams.get("search") || "";
    const classId = searchParams.get("classId") || "";
    const includeInactive = searchParams.get("includeInactive") === "true";

    const filter: Record<string, unknown> = {};
    if (!includeInactive) {
      filter.active = true;
    }

    if (classId) {
      filter.classId = classId;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { studentId: searchRegex },
        { rollNumber: searchRegex },
        { fatherName: searchRegex },
      ];
    }

    const students = await Student.find(filter)
      .populate("classId", "className section")
      .sort({ rollNumber: 1, name: 1 })
      .lean();

    return NextResponse.json({ success: true, count: students.length, students });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Students GET error:", err);
    return NextResponse.json({ error: "Failed to fetch students." }, { status: 500 });
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
    const { studentId, name, fatherName, rollNumber, classId } = body;

    if (!studentId || !name || !fatherName || !rollNumber || !classId) {
      return NextResponse.json(
        { error: "All fields (Student ID, Name, Father Name, Roll Number, Class) are required." },
        { status: 400 }
      );
    }

    const cleanStudentId = String(studentId).trim();
    const cleanName = String(name).trim();
    const cleanFatherName = String(fatherName).trim();
    const cleanRollNumber = String(rollNumber).trim();

    // Verify class exists
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return NextResponse.json({ error: "Selected class does not exist." }, { status: 400 });
    }

    // Check unique studentId
    const existingStudentId = await Student.findOne({ studentId: cleanStudentId });
    if (existingStudentId) {
      return NextResponse.json(
        { error: `Student ID "${cleanStudentId}" is already taken.` },
        { status: 409 }
      );
    }

    // Check roll number uniqueness within this class for active students
    const existingRoll = await Student.findOne({
      classId,
      rollNumber: cleanRollNumber,
      active: true,
    });
    if (existingRoll) {
      return NextResponse.json(
        {
          error: `Roll number "${cleanRollNumber}" already exists in class ${classExists.className}-${classExists.section}.`,
        },
        { status: 409 }
      );
    }

    const newStudent = await Student.create({
      studentId: cleanStudentId,
      name: cleanName,
      fatherName: cleanFatherName,
      rollNumber: cleanRollNumber,
      classId,
      active: true,
    });

    const populated = await Student.findById(newStudent._id).populate("classId", "className section");

    return NextResponse.json(
      {
        success: true,
        message: `Student "${cleanName}" added successfully.`,
        student: populated,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Students POST error:", err);
    return NextResponse.json({ error: "Failed to add student." }, { status: 500 });
  }
}
