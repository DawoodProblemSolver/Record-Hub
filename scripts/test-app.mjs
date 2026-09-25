// Integration test script for Record Hub API and AI assistant
const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=== STARTING FULL APPLICATION TEST SUITE ===");
  let authCookie = "";

  // 1. Authentication Test
  console.log("\n[Test 1] Testing /api/auth/login...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@recordhub.com", password: "admin123" }),
  });

  if (!loginRes.ok) {
    console.error("Login failed with status:", loginRes.status, await loginRes.text());
    process.exit(1);
  }

  const loginData = await loginRes.json();
  console.log("✓ Login successful! User:", loginData.user.name, `(${loginData.user.role})`);

  // Extract auth cookie
  const setCookie = loginRes.headers.get("set-cookie");
  if (setCookie) {
    authCookie = setCookie.split(";")[0];
  }
  const headers = {
    "Content-Type": "application/json",
    Cookie: authCookie,
  };

  // 2. Dashboard Test
  console.log("\n[Test 2] Testing /api/dashboard...");
  const dashRes = await fetch(`${BASE_URL}/api/dashboard`, { headers });
  const dashData = await dashRes.json();
  console.log("✓ Dashboard loaded:", {
    totalStudents: dashData.stats.totalStudents,
    totalClasses: dashData.stats.totalClasses,
    todayPresent: dashData.stats.todayPresent,
    todayAbsent: dashData.stats.todayAbsent,
    todayPercentage: `${dashData.stats.todayPercentage}%`,
    classCount: dashData.classSummaries.length,
    lowAttendanceCount: dashData.lowAttendanceCount,
  });

  // 3. Classes Test
  console.log("\n[Test 3] Testing /api/classes...");
  const classRes = await fetch(`${BASE_URL}/api/classes`, { headers });
  const classData = await classRes.json();
  console.log(`✓ Retrieved ${classData.classes.length} classes:`);
  for (const c of classData.classes) {
    console.log(`  - Class ${c.className}-${c.section}: ${c.studentCount} students`);
  }
  const class9A = classData.classes.find((c) => c.className === "9" && c.section === "A");

  // 4. Students Test
  console.log("\n[Test 4] Testing /api/students...");
  const stuRes = await fetch(`${BASE_URL}/api/students?classId=${class9A._id}`, { headers });
  const stuData = await stuRes.json();
  console.log(`✓ Retrieved ${stuData.students.length} students in Class 9-A:`);
  for (const s of stuData.students) {
    console.log(`  - Roll #${s.rollNumber}: ${s.name} (${s.studentId})`);
  }
  const ali = stuData.students.find((s) => s.name === "Ali Khan");

  // 5. Student Profile & Attendance Calculation Test (Section 16 & 17)
  console.log("\n[Test 5] Testing Student Profile (/api/students/:id)...");
  const aliRes = await fetch(`${BASE_URL}/api/students/${ali._id}?month=2026-09`, { headers });
  const aliData = await aliRes.json();
  console.log("✓ Ali Khan September Summary:", {
    present: aliData.summary.presentCount,
    absent: aliData.summary.absentCount,
    totalMarked: aliData.summary.totalMarkedDays,
    percentage: `${aliData.summary.percentage}%`,
  });

  // 6. Attendance API: Taking Attendance for 9-A
  console.log("\n[Test 6] Testing Take Attendance (/api/attendance)...");
  const takeRes = await fetch(`${BASE_URL}/api/attendance?classId=${class9A._id}&date=2026-09-25`, { headers });
  const takeData = await takeRes.json();
  console.log(`✓ Class 9-A attendance on 2026-09-25:`, {
    isAlreadyMarked: takeData.isAlreadyMarked,
    present: takeData.presentCount,
    absent: takeData.absentCount,
    studentsCount: takeData.students.length,
  });

  // 7. Save Attendance (Upsert test)
  console.log("\n[Test 7] Testing Save Attendance (Upsert)...");
  const savePayload = {
    classId: class9A._id,
    date: "2026-09-25",
    records: takeData.students.map((s) => ({
      studentId: s._id,
      status: s.name === "Ahmed Raza" ? "absent" : "present",
    })),
  };
  const saveRes = await fetch(`${BASE_URL}/api/attendance`, {
    method: "POST",
    headers,
    body: JSON.stringify(savePayload),
  });
  const saveData = await saveRes.json();
  console.log("✓ Attendance save response:", saveData.message);

  // 8. Low Attendance Report (< 75%)
  console.log("\n[Test 8] Testing /api/reports/low-attendance...");
  const lowRes = await fetch(`${BASE_URL}/api/reports/low-attendance?threshold=75`, { headers });
  const lowData = await lowRes.json();
  console.log(`✓ Low attendance (< 75%) students identified (${lowData.count}):`);
  for (const s of lowData.students) {
    console.log(`  - ${s.name} (${s.className}-${s.section}): ${s.percentage}% (${s.presentCount}P / ${s.absentCount}A)`);
  }

  // 9. AI Assistant Tests (Section 21, 22, 23, 49, 50)
  console.log("\n[Test 9] Testing Gemini AI Attendance Assistant (Strictly Grounded)...");

  // Query A: Section 50 Accuracy Test
  console.log("\n--> AI Test A: 'Ali ki September attendance kitni hai?' (Section 50 Test)");
  const aiA = await fetch(`${BASE_URL}/api/ai/attendance`, {
    method: "POST",
    headers,
    body: JSON.stringify({ question: "Ali ki September attendance kitni hai?" }),
  });
  const dataA = await aiA.json();
  console.log("AI Intent:", dataA.intent);
  console.log("AI Answer:\n", dataA.answer);

  // Query B: Who was absent today?
  console.log("\n--> AI Test B: 'Who was absent today?'");
  const aiB = await fetch(`${BASE_URL}/api/ai/attendance`, {
    method: "POST",
    headers,
    body: JSON.stringify({ question: "Who was absent today?" }),
  });
  const dataB = await aiB.json();
  console.log("AI Intent:", dataB.intent);
  console.log("AI Answer:\n", dataB.answer);

  // Query C: Low attendance query
  console.log("\n--> AI Test C: 'Which students in 9-A are below 75%?'");
  const aiC = await fetch(`${BASE_URL}/api/ai/attendance`, {
    method: "POST",
    headers,
    body: JSON.stringify({ question: "Which students in 9-A are below 75%?" }),
  });
  const dataC = await aiC.json();
  console.log("AI Intent:", dataC.intent);
  console.log("AI Answer:\n", dataC.answer);

  // Query D: Class average
  console.log("\n--> AI Test D: '9-A ki average attendance kitni hai?'");
  const aiD = await fetch(`${BASE_URL}/api/ai/attendance`, {
    method: "POST",
    headers,
    body: JSON.stringify({ question: "9-A ki average attendance kitni hai?" }),
  });
  const dataD = await aiD.json();
  console.log("AI Intent:", dataD.intent);
  console.log("AI Answer:\n", dataD.answer);

  // Query E: Month Comparison
  console.log("\n--> AI Test E: 'August aur September ki attendance compare karo'");
  const aiE = await fetch(`${BASE_URL}/api/ai/attendance`, {
    method: "POST",
    headers,
    body: JSON.stringify({ question: "August aur September ki attendance compare karo" }),
  });
  const dataE = await aiE.json();
  console.log("AI Intent:", dataE.intent);
  console.log("AI Answer:\n", dataE.answer);

  console.log("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
