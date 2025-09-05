import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import { Note } from "@/models/Note";
import { User } from "@/models/User";

// POST /api/spaced-repetition/review
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { noteId, quality, responseTime } = await req.json();

    if (!noteId || typeof quality !== "number") {
      return NextResponse.json({ message: "noteId and numeric quality are required" }, { status: 400 });
    }

    await connectToDB();

    const userId = auth.id;

    const note = await Note.findOne({ _id: noteId, author: userId });
    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    // SM-2 inspired algorithm (parity with Express)
    let interval = note.spacedRepetition?.interval || 1;
    let difficulty = note.spacedRepetition?.difficulty || 2.5;
    let reviewCount = note.spacedRepetition?.reviewCount || 0;

    if (quality >= 3) {
      // Correct response
      if (reviewCount === 0) {
        interval = 1;
      } else if (reviewCount === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * difficulty);
      }
      reviewCount += 1;
    } else {
      // Incorrect response - reset
      reviewCount = 0;
      interval = 1;
    }

    // Update difficulty factor
    difficulty = difficulty + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    difficulty = Math.max(1.3, difficulty);

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    await Note.findByIdAndUpdate(noteId, {
      $set: {
        "spacedRepetition.interval": interval,
        "spacedRepetition.difficulty": difficulty,
        "spacedRepetition.reviewCount": reviewCount,
        "spacedRepetition.lastReviewed": new Date(),
        "spacedRepetition.nextReview": nextReview,
      },
    });

    // Update user streak (simplified)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Read-only fetch
    const userDoc = await User.findById(userId).lean();
    const prefs: any = (userDoc?.preferences as any) || {};
    const sr: any = prefs.spacedRepetition || {};
    const lastReviewDate: Date | undefined = sr.lastReviewDate ? new Date(sr.lastReviewDate) : undefined;
    let newStreak: number = sr.streak || 0;

    if (!lastReviewDate || lastReviewDate < today) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastReviewDate && lastReviewDate.getTime() === yesterday.getTime()) {
        newStreak += 1;
      } else if (!lastReviewDate || lastReviewDate < yesterday) {
        newStreak = 1;
      }

      await User.findByIdAndUpdate(userId, {
        $set: {
          "preferences.spacedRepetition.streak": newStreak,
          "preferences.spacedRepetition.lastReviewDate": today,
        },
      });
    }

    return NextResponse.json({
      message: "Review submitted successfully",
      nextReview,
      interval,
      difficulty,
    });
  } catch (error) {
    console.error("Submit review error:", error);
    return NextResponse.json({ message: "Error submitting review" }, { status: 500 });
  }
}