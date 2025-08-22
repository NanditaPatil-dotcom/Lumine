const mongoose = require("mongoose")

const noteSchema = new mongoose.Schema(
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
      type: mongoose.Schema.Types.ObjectId,
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
      nextReview: Date,
      reviewCount: {
        type: Number,
        default: 0,
      },
      lastReviewed: Date,
      interval: {
        type: Number,
        default: 3, // days
      },
    },
    aiGenerated: {
      type: Boolean,
      default: false,
    },
    linkedNotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
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
  {
    timestamps: true,
  },
)

// Index for search functionality
noteSchema.index({
  title: "text",
  content: "text",
  tags: "text",
})

// Index for spaced repetition queries
noteSchema.index({
  "spacedRepetition.enabled": 1,
  "spacedRepetition.nextReview": 1,
})

// Index for user notes
noteSchema.index({ author: 1, createdAt: -1 })

module.exports = mongoose.model("Note", noteSchema)
