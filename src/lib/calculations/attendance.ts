/**
 * Attendance calculation helpers
 * Rule: Attendance Percentage = (Present Days / Total Marked Attendance Days) * 100
 * Only marked days (present + absent) are included. Unmarked is excluded.
 */

export function calculateAttendancePercentage(presentCount: number, absentCount: number): number {
  const totalMarked = presentCount + absentCount;
  if (totalMarked === 0) return 0;
  const percentage = (presentCount / totalMarked) * 100;
  return Math.round(percentage * 100) / 100; // 2 decimal places e.g. 91.67
}

export function formatAttendanceString(percentage: number): string {
  return `${percentage.toFixed(2)}%`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
