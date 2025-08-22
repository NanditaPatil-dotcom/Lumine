const mongoose = require("mongoose")

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sourceNote: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["multiple-choice", "true-false", "short-answer", "flashcard"],
          default: "multiple-choice",
        },
        options: [String], // For multiple choice
        correctAnswer: String,
        explanation: String,
        difficulty: {
          type: Number,
          min: 1,
          max: 5,
          default: 3,
        },
      },
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
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Quiz", quizSchema)
