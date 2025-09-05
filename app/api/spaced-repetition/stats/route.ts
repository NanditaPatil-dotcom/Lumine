import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import { Note } from "@/models/Note";
import { User } from "@/models/User";

// GET /api/spaced-repetition/stats
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    await connectToDB();

    const userId = auth.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const totalNotes = await Note.countDocuments({
      author: userId,
      "spacedRepetition.enabled": true,
    });

    const reviewsToday = await Note.countDocuments({
      author: userId,
      "spacedRepetition.enabled": true,
      "spacedRepetition.lastReviewed": { $gte: today, $lt: tomorrow },
    });

    const dueToday = await Note.countDocuments({
      author: userId,
      "spacedRepetition.enabled": true,
      "spacedRepetition.nextReview": { $lte: new Date() },
    });

    const user = await User.findById(userId);
    const streak = user?.preferences?.spacedRepetition?.streak || 0;

    const stats = {
      totalReviews: totalNotes * 3, // simplified parity with Express
      streak,
      accuracy: 85, // placeholder as in Express route
      averageResponseTime: 4500, // placeholder
      reviewsToday,
      dueToday,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json({ message: "Error fetching review statistics" }, { status: 500 });
  }
}