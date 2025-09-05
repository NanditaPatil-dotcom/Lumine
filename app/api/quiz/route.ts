import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import { Quiz } from "@/models/Quiz";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    await connectToDB();

    const quizzes = await Quiz.find({ author: auth.id })
      .sort({ createdAt: -1 })
      .populate('sourceNote', 'title');

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error("Get quizzes error:", error);
    return NextResponse.json({ message: "Error fetching quizzes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { title, description, questions, sourceNote } = await req.json();

    await connectToDB();

    const quiz = await Quiz.create({
      title,
      description,
      questions,
      sourceNote,
      author: auth.id,
      aiGenerated: false,
    });

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("Create quiz error:", error);
    return NextResponse.json({ message: "Error creating quiz" }, { status: 500 });
  }
}
