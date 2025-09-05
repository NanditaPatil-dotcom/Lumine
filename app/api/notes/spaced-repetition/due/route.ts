import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Note } from "@/models/Note";

// GET /api/notes/spaced-repetition/due
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    await connectToDB();

    const now = new Date();
    const notes = await Note.find({
      author: auth.id,
      "spacedRepetition.enabled": true,
      "spacedRepetition.nextReview": { $lte: now },
    }).sort({ "spacedRepetition.nextReview": 1 });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Get spaced repetition notes error:", error);
    return NextResponse.json(
      { message: "Server error fetching spaced repetition notes" },
      { status: 500 }
    );
  }
}