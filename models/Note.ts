import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface INote extends Document {
  title: string;
  content: string;
  author: Types.ObjectId;
  tags: string[];
  category: string;
  isMarkdown: boolean;
  spacedRepetition: {
    enabled: boolean;
    difficulty: number;
    nextReview?: Date;
    reviewCount: number;
    lastReviewed?: Date;
    interval: number;
  };
  aiGenerated: boolean;
  linkedNotes: Types.ObjectId[];
  position: {
    x: number;
    y: number;
  };
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    category: {
      type: String,
      trim: true,
      default: "general",
    },
    isMarkdown: {
      type: Boolean,
      default: true,
    },
    spacedRepetition: {
      enabled: {
        type: Boolean,
        default: false,
      },
      difficulty: {
        type: Number,
        min: 1,
        max: 5,
        default: 3,
      },
      nextReview: { type: Date },
      reviewCount: {
        type: Number,
        default: 0,
      },
      lastReviewed: { type: Date },
      interval: {
        type: Number,
        default: 3,
      },
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    linkedNotes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Note",
      },
    ],
    position: {
      x: {
        type: Number,
        default: 0,
      },
      y: {
        type: Number,
        default: 0,
      },
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes
NoteSchema.index({
  title: "text",
  content: "text",
  tags: "text",
});

NoteSchema.index({
  "spacedRepetition.enabled": 1,
  "spacedRepetition.nextReview": 1,
});

NoteSchema.index({ author: 1, createdAt: -1 });

export const Note: Model<INote> =
  mongoose.models.Note || mongoose.model<INote>("Note", NoteSchema);