import mongoose, { Schema, Model } from "mongoose";

export interface IClassDocument extends mongoose.Document {
  className: string;
  section: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClassDocument>(
  {
    className: {
      type: String,
      required: [true, "Class name is required (e.g. 9, 10, Grade 9)"],
      trim: true,
    },
    section: {
      type: String,
      required: [true, "Section is required (e.g. A, B)"],
      trim: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to avoid duplicate class & section combinations
ClassSchema.index({ className: 1, section: 1 }, { unique: true });

export const Class: Model<IClassDocument> =
  mongoose.models.Class || mongoose.model<IClassDocument>("Class", ClassSchema);
