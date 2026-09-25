import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/jwt";
import { retrieveAttendanceContext } from "@/lib/ai/data-retriever";
import { askGemini } from "@/lib/ai/gemini";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { question } = body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    // Step 1: Query MongoDB to retrieve real verified data (NO HALLUCINATION)
    const verifiedContext = await retrieveAttendanceContext(question.trim());

    // Step 2: System instruction for Gemini
    const systemInstruction = `You are the official Record Hub AI Attendance Data Assistant for schools.
Your job is to answer the teacher or administrator's question using ONLY the verified database facts provided.
CRITICAL INTEGRITY RULES:
1. NEVER invent, fabricate, or assume numbers, dates, or student names.
2. The provided VERIFIED DATABASE DATA is the absolute source of truth.
3. Keep your response direct, professional, crisp, and data-driven (e.g. bullet points for student lists, exact percentages, present/absent numbers).
4. If the question is in Roman Urdu (e.g. "Ali ki attendance kitni hai?", "Aaj kon absent tha?", "9-A mein kis student ki attendance 75% se kam hai?"), reply in natural, respectful Roman Urdu. If asked in English, answer in English.
5. If verified data has no records or total is 0, state clearly that no attendance records are available. Never guess.`;

    const prompt = `VERIFIED DATABASE DATA:
${JSON.stringify(verifiedContext, null, 2)}

USER QUESTION:
"${question.trim()}"

Provide a clear, accurate, and concise answer based strictly on the verified data above:`;

    let aiResponse = "";
    try {
      aiResponse = await askGemini(prompt, systemInstruction);
    } catch (aiErr: unknown) {
      console.error("Gemini API call failed, falling back to direct formatted summary:", aiErr);
      // Fallback: If Gemini API key has quota or rate issue, return the verified facts cleanly
      if (verifiedContext.intent === "STUDENT_ATTENDANCE") {
        const d = verifiedContext.data as {
          studentName: string;
          presentCount: number;
          absentCount: number;
          percentage: number;
        };
        aiResponse = `${d.studentName}'s Attendance: ${d.presentCount} Present, ${d.absentCount} Absent. Attendance Percentage: ${d.percentage}%.`;
      } else if (verifiedContext.intent === "LOW_ATTENDANCE") {
        const d = verifiedContext.data as {
          students: Array<{ name: string; percentage: number }>;
          threshold: number;
        };
        aiResponse = `${d.students.length} students have attendance below ${d.threshold}%:\n` +
          d.students.map((s) => `• ${s.name} — ${s.percentage}%`).join("\n");
      } else if (verifiedContext.intent === "DAILY_ABSENT_LIST") {
        const d = verifiedContext.data as {
          students: Array<{ name: string; className: string }>;
          date: string;
        };
        aiResponse = `${d.students.length} students absent on ${d.date}:\n` +
          d.students.map((s) => `• ${s.name} (${s.className})`).join("\n");
      } else {
        aiResponse = verifiedContext.summary;
      }
    }

    return NextResponse.json({
      success: true,
      answer: aiResponse,
      intent: verifiedContext.intent,
      data: verifiedContext.data,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("AI Assistant API error:", err);
    return NextResponse.json(
      { error: "AI assistant is temporarily unavailable. Please try again." },
      { status: 500 }
    );
  }
}
