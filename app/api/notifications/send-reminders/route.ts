import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import { User } from "@/models/User";
import { Note } from "@/models/Note";
import { ensureWebPushConfigured, webpush } from "@/lib/webpush";

// POST /api/notifications/send-reminders
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    await connectToDB();

    ensureWebPushConfigured();

    const now = new Date();
    const users = await User.find({
      "preferences.notifications.webPush": true,
      pushSubscription: { $exists: true },
    });

    let sentCount = 0;

    for (const user of users) {
      const dueNotes = await Note.find({
        author: user._id,
        "spacedRepetition.enabled": true,
        "spacedRepetition.nextReview": { $lte: now },
      }).limit(5);

      if (dueNotes.length > 0) {
        const payload = JSON.stringify({
          title: "Time to Review!",
          body: `You have ${dueNotes.length} note${dueNotes.length > 1 ? "s" : ""} ready for review`,
          icon: "/icon-192x192.png",
          badge: "/badge-72x72.png",
          data: {
            url: "/notes?filter=due",
          },
        });

        try {
          await webpush.sendNotification((user as any).pushSubscription, payload);
          sentCount++;
        } catch (pushError: any) {
          console.error(`Failed to send notification to user ${user._id}:`, pushError);
          if (pushError?.statusCode === 410) {
            // Remove invalid subscription
            await User.findByIdAndUpdate(user._id, {
              $unset: { pushSubscription: 1 },
            });
          }
        }
      }
    }

    return NextResponse.json({ message: `Sent ${sentCount} reminder notifications` });
  } catch (error) {
    console.error("Send reminders error:", error);
    return NextResponse.json({ message: "Error sending reminder notifications" }, { status: 500 });
  }
}