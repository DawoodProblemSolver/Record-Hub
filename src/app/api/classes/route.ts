import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Class } from "@/lib/models/Class";
import { Student } from "@/lib/models/Student";
import { getCurrentUser } from "@/lib/auth/jwt";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectDB();
    const classes = await Class.find().sort({ className: 1, section: 1 }).lean();

    // Attach real student count to each class
    const classesWithCounts = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await Student.countDocuments({ classId: cls._id, active: true });
        return {
          ...cls,
          studentCount,
        };
      })
    );

    return NextResponse.json({ success: true, classes: classesWithCounts });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Classes GET error:", err);
    return NextResponse.json({ error: "Failed to fetch classes." }, { status: 500 });
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
    const { className, section } = body;

    if (!className || !section) {
      return NextResponse.json(
        { error: "Class name and section are required." },
        { status: 400 }
      );
    }

    const cleanClassName = className.trim();
    const cleanSection = section.trim().toUpperCase();

    // Check duplicate
    const existing = await Class.findOne({
      className: new RegExp(`^${cleanClassName}$`, "i"),
      section: new RegExp(`^${cleanSection}$`, "i"),
    });

    if (existing) {
      return NextResponse.json(
        { error: `Class ${cleanClassName}-${cleanSection} already exists.` },
        { status: 409 }
      );
    }

    const newClass = await Class.create({
      className: cleanClassName,
      section: cleanSection,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Class ${cleanClassName}-${cleanSection} created successfully.`,
        class: newClass,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Classes POST error:", err);
    return NextResponse.json({ error: "Failed to create class." }, { status: 500 });
  }
}
