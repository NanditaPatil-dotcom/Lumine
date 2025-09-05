import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { Note } from "@/models/Note";

// GET /api/notes/[id]
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(_req as NextRequest);
    if (auth instanceof NextResponse) return auth;

    await connectToDB();

    const note = await Note.findOne({
      _id: params.id,
      author: auth.id,
    }).populate("linkedNotes", "title");

    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Get note error:", error);
    return NextResponse.json({ message: "Server error fetching note" }, { status: 500 });
  }
}

// PUT /api/notes/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const updateData: any = await req.json();

    // Handle spaced repetition updates similar to Express
    if (updateData.spacedRepetition?.enabled && !updateData.spacedRepetition.nextReview) {
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + (updateData.spacedRepetition.interval || 3));

      updateData.spacedRepetition = {
        ...updateData.spacedRepetition,
        nextReview,
        reviewCount: updateData.spacedRepetition.reviewCount || 0,
        lastReviewed: updateData.spacedRepetition.lastReviewed || undefined,
      };
    }

    await connectToDB();

    const note = await Note.findOneAndUpdate(
      { _id: params.id, author: auth.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Update note error:", error);
    return NextResponse.json({ message: "Server error updating note" }, { status: 500 });
  }
}

// DELETE /api/notes/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    await connectToDB();

    const note = await Note.findOneAndDelete({
      _id: params.id,
      author: auth.id,
    });

    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Delete note error:", error);
    return NextResponse.json({ message: "Server error deleting note" }, { status: 500 });
  }
}