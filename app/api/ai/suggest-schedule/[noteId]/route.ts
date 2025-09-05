import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import { Note } from "@/models/Note";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest, { params }: { params: { noteId: string } }) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { currentDifficulty, reviewHistory } = await req.json();

    await connectToDB();

    const note = await Note.findOne({ _id: params.noteId, author: auth.id });
    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Based on spaced repetition principles and this note's difficulty (${currentDifficulty}/5), 
suggest an optimal review schedule. Consider the note content complexity and user's review history.
    
Note: ${note.title}
Current difficulty: ${currentDifficulty}
Review history: ${JSON.stringify(reviewHistory)}
    
Return a JSON object with suggested intervals in days: {"intervals": [3, 7, 14, 30]}`;

    const result = await model.generateContent(prompt);

    try {
      const suggestion = JSON.parse(result.response.text());
      return NextResponse.json(suggestion);
    } catch {
      // Fallback schedule
      const baseIntervals = [1, 3, 7, 14, 30];
      const adjustedIntervals = baseIntervals.map((interval) =>
        Math.max(1, Math.round((interval * (6 - (Number(currentDifficulty) || 3))) / 3))
      );
      return NextResponse.json({ intervals: adjustedIntervals });
    }
  } catch (error) {
    console.error("Suggest schedule error:", error);
    return NextResponse.json({ message: "Error suggesting schedule with AI" }, { status: 500 });
  }
}