import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface IQuizQuestion {
  question: string;
  type: "multiple-choice" | "true-false" | "short-answer" | "flashcard";
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  difficulty?: number;
}

export interface IQuiz extends Document {
  title: string;
  description?: string;
  author: Types.ObjectId;
  sourceNote?: Types.ObjectId;
  questions: IQuizQuestion[];
  aiGenerated: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema<IQuiz>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: { type: String },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sourceNote: {
      type: Schema.Types.ObjectId,
      ref: "Note",
    },
    questions: [
      new Schema<IQuizQuestion>(
        {
          question: { type: String, required: true },
          type: {
            type: String,
            enum: ["multiple-choice", "true-false", "short-answer", "flashcard"],
            default: "multiple-choice",
          },
          options: [{ type: String }],
          correctAnswer: { type: String },
          explanation: { type: String },
          difficulty: { type: Number, min: 1, max: 5, default: 3 },
        },
        { _id: false }
      ),
    ],
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Quiz: Model<IQuiz> =
  mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);