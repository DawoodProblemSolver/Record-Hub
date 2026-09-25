import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/models/User";
import { Class } from "@/lib/models/Class";
import { Student } from "@/lib/models/Student";
import { Attendance } from "@/lib/models/Attendance";
import { hashPassword } from "@/lib/auth/jwt";

export async function POST() {
  try {
    await connectDB();

    // 1. Ensure default admin user exists
    let admin = await User.findOne({ email: "admin@recordhub.com" });
    if (!admin) {
      admin = await User.create({
        name: "Principal Farooq",
        email: "admin@recordhub.com",
        passwordHash: await hashPassword("admin123"),
        role: "admin",
      });
    }

    // 2. Classes to seed
    const classData = [
      { className: "9", section: "A" },
      { className: "9", section: "B" },
      { className: "10", section: "A" },
      { className: "10", section: "B" },
    ];

    const classMap = new Map();
    for (const c of classData) {
      let cls = await Class.findOne({ className: c.className, section: c.section });
      if (!cls) {
        cls = await Class.create(c);
      }
      classMap.set(`${c.className}-${c.section}`, cls._id);
    }

    const class9AId = classMap.get("9-A");
    const class9BId = classMap.get("9-B");
    const class10AId = classMap.get("10-A");

    // 3. Students to seed
    // Notice: Ali Khan is specifically set up in 9-A for the Section 50 verification:
    // 22 present + 2 absent = 24 total marked days = 91.67%
    const studentList = [
      // Class 9-A
      {
        studentId: "STU-901",
        name: "Ali Khan",
        fatherName: "Tariq Khan",
        rollNumber: "01",
        classId: class9AId,
      },
      {
        studentId: "STU-902",
        name: "Ahmed Raza",
        fatherName: "Raza Ullah",
        rollNumber: "02",
        classId: class9AId,
      },
      {
        studentId: "STU-903",
        name: "Hamza Ali",
        fatherName: "Muhammad Ali",
        rollNumber: "03",
        classId: class9AId,
      },
      {
        studentId: "STU-904",
        name: "Bilal Hussain",
        fatherName: "Hussain Shah",
        rollNumber: "04",
        classId: class9AId,
      },
      {
        studentId: "STU-905",
        name: "Zainab Bibi",
        fatherName: "Bibi Rehman",
        rollNumber: "05",
        classId: class9AId,
      },

      // Class 9-B
      {
        studentId: "STU-920",
        name: "Usman Tariq",
        fatherName: "Tariq Mehmood",
        rollNumber: "01",
        classId: class9BId,
      },
      {
        studentId: "STU-921",
        name: "Fatima Noor",
        fatherName: "Noor ul Hassan",
        rollNumber: "02",
        classId: class9BId,
      },

      // Class 10-A
      {
        studentId: "STU-101",
        name: "Hassan Abbas",
        fatherName: "Abbas Ali",
        rollNumber: "01",
        classId: class10AId,
      },
      {
        studentId: "STU-102",
        name: "Ayesha Malik",
        fatherName: "Malik Irfan",
        rollNumber: "02",
        classId: class10AId,
      },
    ];

    const studentMap = new Map();
    for (const s of studentList) {
      let stu = await Student.findOne({ studentId: s.studentId });
      if (!stu) {
        stu = await Student.create(s);
      }
      studentMap.set(s.name, stu);
    }

    // 4. Generate September 2026 Historical Attendance
    // Specifically giving Ali Khan 22 present days and 2 absent days (total 24 marked days, 91.67%)
    const aliStudent = studentMap.get("Ali Khan");
    const ahmedStudent = studentMap.get("Ahmed Raza");
    const hamzaStudent = studentMap.get("Hamza Ali");
    const bilalStudent = studentMap.get("Bilal Hussain");

    const daysInSeptember = 24; // working school days
    const attendanceOps = [];

    for (let day = 1; day <= daysInSeptember; day++) {
      const dayStr = String(day).padStart(2, "0");
      const date = `2026-09-${dayStr}`;

      // Ali Khan: 22 present, 2 absent (absent on Sep 03 and Sep 15)
      const aliStatus = day === 3 || day === 15 ? "absent" : "present";
      attendanceOps.push({
        updateOne: {
          filter: { studentId: aliStudent._id, date },
          update: {
            $set: {
              studentId: aliStudent._id,
              classId: class9AId,
              date,
              status: aliStatus,
              markedBy: "Teacher",
            },
          },
          upsert: true,
        },
      });

      // Ahmed Raza: Low attendance (e.g. 17 present, 7 absent = 70.83% < 75%)
      const ahmedStatus = day % 3 === 0 ? "absent" : "present";
      attendanceOps.push({
        updateOne: {
          filter: { studentId: ahmedStudent._id, date },
          update: {
            $set: {
              studentId: ahmedStudent._id,
              classId: class9AId,
              date,
              status: ahmedStatus,
              markedBy: "Teacher",
            },
          },
          upsert: true,
        },
      });

      // Bilal Hussain: Low attendance (16 present, 8 absent = 66.67% < 75%)
      const bilalStatus = day % 3 === 1 ? "absent" : "present";
      attendanceOps.push({
        updateOne: {
          filter: { studentId: bilalStudent._id, date },
          update: {
            $set: {
              studentId: bilalStudent._id,
              classId: class9AId,
              date,
              status: bilalStatus,
              markedBy: "Teacher",
            },
          },
          upsert: true,
        },
      });

      // Hamza Ali: 23 present, 1 absent = 95.83%
      const hamzaStatus = day === 10 ? "absent" : "present";
      attendanceOps.push({
        updateOne: {
          filter: { studentId: hamzaStudent._id, date },
          update: {
            $set: {
              studentId: hamzaStudent._id,
              classId: class9AId,
              date,
              status: hamzaStatus,
              markedBy: "Teacher",
            },
          },
          upsert: true,
        },
      });
    }

    // Also seed August 2026 for month-comparison query testing
    for (let day = 1; day <= 20; day++) {
      const dayStr = String(day).padStart(2, "0");
      const date = `2026-08-${dayStr}`;
      attendanceOps.push({
        updateOne: {
          filter: { studentId: aliStudent._id, date },
          update: {
            $set: {
              studentId: aliStudent._id,
              classId: class9AId,
              date,
              status: day % 4 === 0 ? "absent" : "present",
              markedBy: "Teacher",
            },
          },
          upsert: true,
        },
      });
    }

    // Today's attendance (2026-09-25)
    attendanceOps.push({
      updateOne: {
        filter: { studentId: aliStudent._id, date: "2026-09-25" },
        update: {
          $set: {
            studentId: aliStudent._id,
            classId: class9AId,
            date: "2026-09-25",
            status: "present",
            markedBy: "Teacher",
          },
        },
        upsert: true,
      },
    });

    attendanceOps.push({
      updateOne: {
        filter: { studentId: ahmedStudent._id, date: "2026-09-25" },
        update: {
          $set: {
            studentId: ahmedStudent._id,
            classId: class9AId,
            date: "2026-09-25",
            status: "absent",
            markedBy: "Teacher",
          },
        },
        upsert: true,
      },
    });

    await Attendance.bulkWrite(attendanceOps as any);

    return NextResponse.json({
      success: true,
      message:
        "Demo sample data seeded successfully! Ali Khan seeded with exactly 22 Present, 2 Absent in September (91.67%). Ahmed Raza & Bilal seeded with < 75% attendance.",
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Seed error:", err);
    return NextResponse.json({ error: "Failed to seed sample data." }, { status: 500 });
  }
}
