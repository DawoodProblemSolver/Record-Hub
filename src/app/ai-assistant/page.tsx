"use client";

import { useState, useRef, useEffect } from "react";
import AppShell from "@/components/AppShell";
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Database,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  verifiedData?: Record<string, unknown>;
}

const SUGGESTED_QUESTIONS = [
  "What is Ali's attendance this month?",
  "Who was absent today?",
  "Which students are below 75%?",
  "9-A ki average attendance kitni hai?",
  "Compare August and September attendance.",
  "Ali kitne din absent raha?",
];

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      sender: "ai",
      text: "Hello! I am your AI Attendance Data Assistant. You can ask me natural-language questions in English or Roman Urdu about your students, classes, absent lists, or attendance trends. All my answers are calculated strictly from your verified database records.",
      timestamp: "Just now",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(queryText?: string) {
    const q = (queryText || inputQuery).trim();
    if (!q || loading) return;

    setError("");
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "AI assistant is temporarily unavailable.");
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        verifiedData: data.data,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to communicate with AI assistant.");
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: "I encountered an error connecting to the database or AI service. Please verify your query or try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([
      {
        id: "intro-cleared",
        sender: "ai",
        text: "Conversation cleared. What attendance questions can I answer for you?",
        timestamp: "Just now",
      },
    ]);
    setError("");
  }

  return (
    <AppShell title="AI Attendance Assistant">
      <div className="flex flex-col h-[calc(100vh-10rem)] max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight">Record Hub AI Analyst</h3>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" />
                  Anti-Hallucination Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Powered by Google Gemini 1.5 Flash • Grounded in MongoDB
              </p>
            </div>
          </div>

          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors border border-slate-700"
            title="Clear message history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? "bg-slate-800 text-white shadow-sm"
                      : "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-sm"
                  }`}
                >
                  {isUser ? "You" : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? "bg-indigo-600 text-white shadow-sm font-medium"
                      : "bg-white text-slate-800 border border-slate-200 shadow-xs"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Verified Data Badge (AI only) */}
                  {!isUser && msg.verifiedData && (
                    <details className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                      <summary className="cursor-pointer font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        <span>View Verified Database Payload</span>
                      </summary>
                      <pre className="mt-2 p-2 bg-slate-100 rounded-lg text-[10px] overflow-x-auto text-slate-700 font-mono">
                        {JSON.stringify(msg.verifiedData, null, 2)}
                      </pre>
                    </details>
                  )}

                  <div
                    className={`mt-1.5 text-[10px] text-right font-medium ${
                      isUser ? "text-indigo-200" : "text-slate-400"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing / Loading indicator */}
          {loading && (
            <div className="flex gap-3 max-w-xl mr-auto animate-in fade-in duration-200">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-500 ml-1 font-medium">
                  Querying MongoDB &amp; analyzing facts...
                </span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Suggested Queries Chips */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-t border-slate-200 overflow-x-auto">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Suggested:
            </span>
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                disabled={loading}
                className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg text-[11px] font-medium border border-slate-200 shadow-2xs transition-colors shrink-0"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              placeholder="Ask attendance question (e.g. 'Ali ki September attendance kitni hai?')..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/25 transition-all active:scale-95"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
