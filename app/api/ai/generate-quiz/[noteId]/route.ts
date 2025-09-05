import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import { Note } from "@/models/Note";
import { Quiz } from "@/models/Quiz";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest, { params }: { params: { noteId: string } }) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { questionCount = 5, difficulty = 3 } = await req.json();

    await connectToDB();

    const note = await Note.findOne({ _id: params.noteId, author: auth.id });
    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Based on this note content, create ${questionCount} quiz questions:

Title: ${note.title}
Content: ${note.content}

Generate questions with difficulty level ${difficulty}/5. Return a JSON array with this structure:
[
  {
    "question": "Question text",
    "type": "multiple-choice",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "explanation": "Why this is correct"
  }
]

Mix question types: multiple-choice, true-false, and short-answer.`;

    const result = await model.generateContent(prompt);
    let questions: any[];

    try {
      questions = JSON.parse(result.response.text());
      if (!Array.isArray(questions)) {
        throw new Error("AI did not return an array");
      }
    } catch {
      // Fallback if JSON parsing fails
      questions = [
        {
          question: `What is the main topic of: ${note.title}?`,
          type: "short-answer",
          correctAnswer: note.title,
          explanation: "Based on the note title and content",
          difficulty,
        },
      ];
    }

    const quiz = await Quiz.create({
      title: `Quiz: ${note.title}`,
      author: auth.id,
      sourceNote: note._id,
      questions,
      aiGenerated: true,
    });

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("Generate quiz error:", error);
    return NextResponse.json({ message: "Error generating quiz with AI" }, { status: 500 });
  }
}