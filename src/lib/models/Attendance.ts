import mongoose, { Schema, Model } from "mongoose";

export interface IAttendanceDocument extends mongoose.Document {
  studentId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  status: "present" | "absent";
  markedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendanceDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "Class reference is required"],
      index: true,
    },
    date: {
      type: String,
      required: [true, "Date (YYYY-MM-DD) is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be formatted as YYYY-MM-DD"],
      index: true,
    },
    status: {
      type: String,
      enum: ["present", "absent"],
      required: [true, "Attendance status is required"],
    },
    markedBy: {
      type: String,
      default: "System",
    },
  },
  {
    timestamps: true,
  }
);

// Crucial: Unique compound index to prevent duplicate attendance on same date for same student
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ classId: 1, date: 1 });
AttendanceSchema.index({ date: 1, status: 1 });

export const Attendance: Model<IAttendanceDocument> =
  mongoose.models.Attendance || mongoose.model<IAttendanceDocument>("Attendance", AttendanceSchema);
