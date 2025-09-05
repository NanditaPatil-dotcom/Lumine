import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import { User } from "@/models/User";
import { ensureWebPushConfigured, webpush } from "@/lib/webpush";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    await connectToDB();

    const user = await User.findById(auth.id);
    if (!user?.pushSubscription) {
      return NextResponse.json({ message: "No push subscription found" }, { status: 400 });
    }

    ensureWebPushConfigured();
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json({ message: "Web push VAPID keys not configured" }, { status: 500 });
    }

    const payload = JSON.stringify({
      title: "Lumine Test",
      body: "Push notifications are working!",
      icon: "/icon-192x192.png",
    });

    await webpush.sendNotification(user.pushSubscription as any, payload);

    return NextResponse.json({ message: "Test notification sent" });
  } catch (error) {
    console.error("Test notification error:", error);
    return NextResponse.json({ message: "Error sending test notification" }, { status: 500 });
  }
}