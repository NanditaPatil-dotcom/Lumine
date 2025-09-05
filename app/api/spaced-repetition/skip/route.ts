import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import { Note } from "@/models/Note";

// POST /api/spaced-repetition/skip
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { noteId } = await req.json();
    if (!noteId) {
      return NextResponse.json({ message: "noteId is required" }, { status: 400 });
    }

    await connectToDB();

    const note = await Note.findOne({ _id: noteId, author: auth.id });
    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + 1);

    await Note.findByIdAndUpdate(noteId, {
      $set: {
        "spacedRepetition.nextReview": nextReview,
      },
    });

    return NextResponse.json({ message: "Note skipped successfully" });
  } catch (error) {
    console.error("Skip note error:", error);
    return NextResponse.json({ message: "Error skipping note" }, { status: 500 });
  }
}