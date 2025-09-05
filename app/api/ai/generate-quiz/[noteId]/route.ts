import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import { Note } from "@/models/Note";
import { Quiz } from "@/models/Quiz";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest, { params }: { params: { noteId: string } }) {
  console.log("Starting quiz generation for noteId:", params.noteId);
  
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { questionCount = 5, difficulty = 3 } = await req.json();
    console.log("Quiz parameters:", { questionCount, difficulty });

    await connectToDB();
    console.log("Database connected");

    const note = await Note.findOne({ _id: params.noteId, author: auth.id });
    if (!note) {
      console.log("Note not found for ID:", params.noteId);
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }
    console.log("Note found:", note.title);

    // Temporary fallback - generate questions without AI to test the pipeline
    console.log("Using fallback quiz generation (no AI dependency)");
    
    const questions = [
      {
        question: `What is the main topic discussed in "${note.title}"?`,
        type: "short-answer",
        correctAnswer: note.title,
        explanation: "This question tests understanding of the note's main subject",
        difficulty,
      },
      {
        question: `True or False: This note is about ${note.title}`,
        type: "true-false",
        options: ["True", "False"],
        correctAnswer: "True",
        explanation: "The note title indicates the main topic",
        difficulty,
      },
      {
        question: `Which category best describes this note?`,
        type: "multiple-choice",
        options: [note.category, "unrelated", "random", "other"],
        correctAnswer: note.category,
        explanation: `This note is categorized as ${note.category}`,
        difficulty,
      },
    ].slice(0, questionCount);

    console.log("Generated fallback questions:", questions.length);

    console.log("Creating quiz in database...");
    const quiz = await Quiz.create({
      title: `Quiz: ${note.title}`,
      author: auth.id,
      sourceNote: note._id,
      questions,
      aiGenerated: true,
    });
    console.log("Quiz created successfully:", quiz._id);

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("Generate quiz error:", error);
    return NextResponse.json({ 
      message: "Error generating quiz with AI", 
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}