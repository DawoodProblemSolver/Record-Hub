import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/record_hub";

// Define Schemas directly for standalone script
const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    passwordHash: String,
    role: { type: String, default: "admin" },
  },
  { timestamps: true }
);

const ClassSchema = new mongoose.Schema(
  {
    className: String,
    section: String,
  },
  { timestamps: true }
);

const StudentSchema = new mongoose.Schema(
  {
    studentId: { type: String, unique: true },
    name: String,
    fatherName: String,
    rollNumber: String,
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const AttendanceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    date: String,
    status: String,
    markedBy: String,
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Class = mongoose.models.Class || mongoose.model("Class", ClassSchema);
const Student = mongoose.models.Student || mongoose.model("Student", StudentSchema);
const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);

async function runSeed() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI, { dbName: "record_hub" });
  console.log("Connected successfully!");

  // 1. Admin
  const adminEmail = "admin@recordhub.com";
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: "Principal Farooq",
      email: adminEmail,
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "admin",
    });
    console.log("Admin account created: admin@recordhub.com / admin123");
  } else {
    console.log("Admin account exists.");
  }

  // 2. Classes
  const classDefs = [
    { className: "9", section: "A" },
    { className: "9", section: "B" },
    { className: "10", section: "A" },
    { className: "10", section: "B" },
  ];

  const classMap = new Map();
  for (const c of classDefs) {
    let cls = await Class.findOne({ className: c.className, section: c.section });
    if (!cls) {
      cls = await Class.create(c);
    }
    classMap.set(`${c.className}-${c.section}`, cls._id);
  }
  console.log("Classes seeded: 9-A, 9-B, 10-A, 10-B");

  const class9AId = classMap.get("9-A");
  const class9BId = classMap.get("9-B");
  const class10AId = classMap.get("10-A");

  // 3. Students
  const studentsList = [
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
    {
      studentId: "STU-920",
      name: "Usman Tariq",
      fatherName: "Tariq Mehmood",
      rollNumber: "01",
      classId: class9BId,
    },
    {
      studentId: "STU-101",
      name: "Hassan Abbas",
      fatherName: "Abbas Ali",
      rollNumber: "01",
      classId: class10AId,
    },
  ];

  const studentMap = new Map();
  for (const s of studentsList) {
    let stu = await Student.findOne({ studentId: s.studentId });
    if (!stu) {
      stu = await Student.create(s);
    }
    studentMap.set(s.name, stu);
  }
  console.log(`Enrolled ${studentsList.length} students across classes.`);

  // 4. Seed Attendance Records for September 2026
  // Exact validation for Ali Khan: 22 Present, 2 Absent = 24 total marked days = 91.67%
  const aliStudent = studentMap.get("Ali Khan");
  const ahmedStudent = studentMap.get("Ahmed Raza");
  const hamzaStudent = studentMap.get("Hamza Ali");
  const bilalStudent = studentMap.get("Bilal Hussain");

  const ops = [];
  const daysInSeptember = 24;

  for (let day = 1; day <= daysInSeptember; day++) {
    const dayStr = String(day).padStart(2, "0");
    const date = `2026-09-${dayStr}`;

    // Ali: Absent on day 3 & 15, Present all other 22 days => 22/24 = 91.67%
    const aliStatus = day === 3 || day === 15 ? "absent" : "present";
    ops.push({
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

    // Ahmed: 17 present, 7 absent = 70.83% (< 75%)
    const ahmedStatus = day % 3 === 0 ? "absent" : "present";
    ops.push({
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

    // Bilal: 16 present, 8 absent = 66.67% (< 75%)
    const bilalStatus = day % 3 === 1 ? "absent" : "present";
    ops.push({
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

    // Hamza: 23 present, 1 absent = 95.83%
    const hamzaStatus = day === 10 ? "absent" : "present";
    ops.push({
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

  // Today (2026-09-25)
  ops.push({
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

  ops.push({
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

  // August month for comparison queries
  for (let day = 1; day <= 20; day++) {
    const dayStr = String(day).padStart(2, "0");
    const date = `2026-08-${dayStr}`;
    ops.push({
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

  await Attendance.bulkWrite(ops);
  console.log(`Successfully upserted ${ops.length} attendance operations.`);
  console.log("Ali Khan in September: 22 Present, 2 Absent = 24 Total (91.67%)");
  console.log("Ahmed Raza & Bilal Hussain: < 75% low attendance");
  console.log("Seed complete!");
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
