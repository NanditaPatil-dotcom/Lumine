import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Note } from "@/models/Note";

// GET /api/notes
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    await connectToDB();

    const { search, tags, category, archived } = Object.fromEntries(req.nextUrl.searchParams.entries());

    const query: any = {
      author: auth.id,
      isArchived: archived === "true" ? true : false,
    };

    if (search) {
      query.$text = { $search: search };
    }

    if (tags) {
      query.tags = { $in: tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) };
    }

    if (category && category !== "all") {
      query.category = category;
    }

    const notes = await Note.find(query)
      .sort({ isPinned: -1, updatedAt: -1 })
      .populate("linkedNotes", "title");

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Get notes error:", error);
    return NextResponse.json({ message: "Server error fetching notes" }, { status: 500 });
  }
}

// POST /api/notes
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();

    // Basic validation similar to express-validator intent
    const errors: { field: string; message: string }[] = [];
    if (!body?.title || typeof body.title !== "string" || body.title.trim().length < 1 || body.title.length > 200) {
      errors.push({ field: "title", message: "Title must be 1-200 characters" });
    }
    if (!body?.content || typeof body.content !== "string" || body.content.trim().length < 1) {
      errors.push({ field: "content", message: "Content is required" });
    }
    if (body?.tags && !Array.isArray(body.tags)) {
      errors.push({ field: "tags", message: "Tags must be an array" });
    }
    if (errors.length) return NextResponse.json({ errors }, { status: 400 });

    await connectToDB();

    const noteData: any = {
      ...body,
      author: auth.id,
    };

    // Normalize optional fields
    if (Array.isArray(noteData.tags)) {
      noteData.tags = noteData.tags.map((t: string) => String(t).trim().toLowerCase()).filter(Boolean);
    }

    // Initialize spaced repetition fields if enabled
    if (noteData.spacedRepetition?.enabled) {
      const nextReview = new Date();
      const interval = noteData.spacedRepetition.interval || 3;
      nextReview.setDate(nextReview.getDate() + interval);

      noteData.spacedRepetition = {
        ...noteData.spacedRepetition,
        nextReview,
        reviewCount: 0,
        lastReviewed: undefined,
        interval,
      };
    }

    const note = await (await Note.create(noteData)).populate("linkedNotes", "title");

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Create note error:", error);
    return NextResponse.json({ message: "Server error creating note" }, { status: 500 });
  }
}