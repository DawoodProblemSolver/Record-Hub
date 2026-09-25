import { connectDB } from "@/lib/db/connect";
import { Student } from "@/lib/models/Student";
import { Class } from "@/lib/models/Class";
import { Attendance } from "@/lib/models/Attendance";
import { calculateAttendancePercentage, getTodayDateString } from "@/lib/calculations/attendance";

export interface RetrievedContext {
  intent: string;
  foundData: boolean;
  summary: string;
  data: Record<string, unknown>;
}

export async function retrieveAttendanceContext(query: string): Promise<RetrievedContext> {
  await connectDB();
  const lowerQuery = query.toLowerCase();
  const today = getTodayDateString();

  // 1. Check for Class reference like "9-a", "9a", "10-b", "10b", etc.
  const classMatch = lowerQuery.match(/\b([0-9]{1,2})\s*[-/ ]?\s*([a-z])\b/i);
  let targetClass = null;
  if (classMatch) {
    const className = classMatch[1];
    const section = classMatch[2].toUpperCase();
    targetClass = await Class.findOne({
      className: new RegExp(`^${className}$`, "i"),
      section: new RegExp(`^${section}$`, "i"),
    });
  }

  // 2. Check for Low Attendance query ("below 75%", "kam hai", "low attendance", "75%")
  const isLowAttendanceQuery =
    lowerQuery.includes("below") ||
    lowerQuery.includes("se kam") ||
    lowerQuery.includes("low") ||
    lowerQuery.includes("<") ||
    lowerQuery.includes("defaulter");

  const thresholdMatch = lowerQuery.match(/(\d{1,2})%/);
  const threshold = thresholdMatch ? parseInt(thresholdMatch[1], 10) : 75;

  if (isLowAttendanceQuery) {
    const filter: Record<string, unknown> = { active: true };
    if (targetClass) {
      filter.classId = targetClass._id;
    }

    const students = await Student.find(filter).populate("classId");
    const lowStudents: Array<{
      name: string;
      rollNumber: string;
      className: string;
      present: number;
      absent: number;
      total: number;
      percentage: number;
    }> = [];

    for (const student of students) {
      const records = await Attendance.find({ studentId: student._id });
      const present = records.filter((r) => r.status === "present").length;
      const absent = records.filter((r) => r.status === "absent").length;
      const total = present + absent;
      if (total > 0) {
        const pct = calculateAttendancePercentage(present, absent);
        if (pct < threshold) {
          const classObj = student.classId as unknown as { className: string; section: string };
          lowStudents.push({
            name: student.name,
            rollNumber: student.rollNumber,
            className: classObj ? `${classObj.className}-${classObj.section}` : "N/A",
            present,
            absent,
            total,
            percentage: pct,
          });
        }
      }
    }

    return {
      intent: "LOW_ATTENDANCE",
      foundData: true,
      summary: `Found ${lowStudents.length} students with attendance below ${threshold}%.`,
      data: {
        threshold,
        totalFound: lowStudents.length,
        filterClass: targetClass ? `${targetClass.className}-${targetClass.section}` : "All Classes",
        students: lowStudents,
      },
    };
  }

  // 3. Check for "Who was absent" or "kon absent tha" or "absent today"
  const isAbsentQuery =
    lowerQuery.includes("absent") &&
    (lowerQuery.includes("who") ||
      lowerQuery.includes("kon") ||
      lowerQuery.includes("kaun") ||
      lowerQuery.includes("list") ||
      lowerQuery.includes("aaj") ||
      lowerQuery.includes("today"));

  if (isAbsentQuery) {
    const dateToSearch = today;
    const filter: Record<string, unknown> = { date: dateToSearch, status: "absent" };
    if (targetClass) {
      filter.classId = targetClass._id;
    }

    const absentRecords = await Attendance.find(filter).populate("studentId").populate("classId");
    const absentList = absentRecords.map((r) => {
      const stu = r.studentId as unknown as { name: string; rollNumber: string };
      const cls = r.classId as unknown as { className: string; section: string };
      return {
        name: stu?.name || "Unknown",
        rollNumber: stu?.rollNumber || "N/A",
        className: cls ? `${cls.className}-${cls.section}` : "N/A",
        date: r.date,
      };
    });

    return {
      intent: "DAILY_ABSENT_LIST",
      foundData: true,
      summary: `Found ${absentList.length} students marked absent on ${dateToSearch}.`,
      data: {
        date: dateToSearch,
        class: targetClass ? `${targetClass.className}-${targetClass.section}` : "All Classes",
        count: absentList.length,
        students: absentList,
      },
    };
  }

  // 4. Check for Student by name (search all students in DB)
  const allStudents = await Student.find({ active: true }).populate("classId");
  let foundStudent = null;

  for (const s of allStudents) {
    const sName = s.name.toLowerCase();
    // Check if query contains the full student name or first name if distinct
    const firstName = sName.split(" ")[0];
    if (lowerQuery.includes(sName) || (firstName.length >= 3 && lowerQuery.includes(firstName))) {
      foundStudent = s;
      break;
    }
  }

  if (foundStudent) {
    // Check date filters: month or year (e.g. "September", "2026", "August")
    let records = await Attendance.find({ studentId: foundStudent._id });

    // Detect month name
    const months = [
      { name: "january", num: "01" },
      { name: "february", num: "02" },
      { name: "march", num: "03" },
      { name: "april", num: "04" },
      { name: "may", num: "05" },
      { name: "june", num: "06" },
      { name: "july", num: "07" },
      { name: "august", num: "08" },
      { name: "september", num: "09" },
      { name: "october", num: "10" },
      { name: "november", num: "11" },
      { name: "december", num: "12" },
    ];

    let specifiedMonth = "";
    for (const m of months) {
      if (lowerQuery.includes(m.name)) {
        specifiedMonth = m.name;
        records = records.filter((r) => r.date.includes(`-${m.num}-`));
        break;
      }
    }

    const presentCount = records.filter((r) => r.status === "present").length;
    const absentCount = records.filter((r) => r.status === "absent").length;
    const totalMarked = presentCount + absentCount;
    const percentage = calculateAttendancePercentage(presentCount, absentCount);

    const classObj = foundStudent.classId as unknown as { className: string; section: string };

    return {
      intent: "STUDENT_ATTENDANCE",
      foundData: totalMarked > 0,
      summary: `Attendance stats for ${foundStudent.name}`,
      data: {
        studentId: foundStudent.studentId,
        studentName: foundStudent.name,
        rollNumber: foundStudent.rollNumber,
        class: classObj ? `${classObj.className}-${classObj.section}` : "N/A",
        timeframe: specifiedMonth ? specifiedMonth.toUpperCase() : "Overall / All time",
        presentCount,
        absentCount,
        totalMarked,
        percentage,
      },
    };
  }

  // 5. Check for Month Comparison (e.g. "August aur September compare", "compare August and September")
  if (lowerQuery.includes("compare") || lowerQuery.includes("muqabla") || lowerQuery.includes("vs")) {
    const isComparingMonths =
      (lowerQuery.includes("august") && lowerQuery.includes("september")) ||
      lowerQuery.includes("month");

    if (isComparingMonths) {
      // Calculate August and September overall
      const augRecords = await Attendance.find({ date: { $regex: /-08-/ } });
      const sepRecords = await Attendance.find({ date: { $regex: /-09-/ } });

      const augPresent = augRecords.filter((r) => r.status === "present").length;
      const augAbsent = augRecords.filter((r) => r.status === "absent").length;
      const augPct = calculateAttendancePercentage(augPresent, augAbsent);

      const sepPresent = sepRecords.filter((r) => r.status === "present").length;
      const sepAbsent = sepRecords.filter((r) => r.status === "absent").length;
      const sepPct = calculateAttendancePercentage(sepPresent, sepAbsent);

      return {
        intent: "MONTH_COMPARISON",
        foundData: augRecords.length > 0 || sepRecords.length > 0,
        summary: "Comparison between August and September",
        data: {
          periodA: {
            month: "August",
            present: augPresent,
            absent: augAbsent,
            total: augPresent + augAbsent,
            percentage: augPct,
          },
          periodB: {
            month: "September",
            present: sepPresent,
            absent: sepAbsent,
            total: sepPresent + sepAbsent,
            percentage: sepPct,
          },
        },
      };
    }
  }

  // 6. Check for Class-specific general summary ("9-A ki average", "Class 10-B total students")
  if (targetClass) {
    const studentsInClass = await Student.find({ classId: targetClass._id, active: true });
    const attendanceRecords = await Attendance.find({ classId: targetClass._id });

    const present = attendanceRecords.filter((r) => r.status === "present").length;
    const absent = attendanceRecords.filter((r) => r.status === "absent").length;
    const total = present + absent;
    const pct = calculateAttendancePercentage(present, absent);

    return {
      intent: "CLASS_SUMMARY",
      foundData: true,
      summary: `Summary for Class ${targetClass.className}-${targetClass.section}`,
      data: {
        className: `${targetClass.className}-${targetClass.section}`,
        totalStudents: studentsInClass.length,
        totalAttendanceMarked: total,
        totalPresent: present,
        totalAbsent: absent,
        averageAttendancePercentage: pct,
      },
    };
  }

  // 7. General overall system stats fallback
  const totalStudents = await Student.countDocuments({ active: true });
  const totalClasses = await Class.countDocuments();
  const todayAttendance = await Attendance.find({ date: today });
  const todayPresent = todayAttendance.filter((r) => r.status === "present").length;
  const todayAbsent = todayAttendance.filter((r) => r.status === "absent").length;
  const todayTotal = todayPresent + todayAbsent;
  const todayPct = calculateAttendancePercentage(todayPresent, todayAbsent);

  return {
    intent: "GENERAL_STATS",
    foundData: true,
    summary: "System overview statistics",
    data: {
      todayDate: today,
      totalStudents,
      totalClasses,
      todayMarkedStudents: todayTotal,
      todayPresent,
      todayAbsent,
      todayPercentage: todayPct,
    },
  };
}
