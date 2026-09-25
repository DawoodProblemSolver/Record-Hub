import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Record Hub — Smart Attendance & Student Records",
  description: "Mark once. Store automatically. Analyze intelligently. Smart attendance management system for schools, academies, and institutes.",
  keywords: "attendance management, school records, student tracking, AI attendance analysis, education software",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 antialiased font-sans selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
