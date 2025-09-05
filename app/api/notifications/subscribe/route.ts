import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { subscription } = await req.json();
    if (!subscription) {
      return NextResponse.json({ message: "Subscription is required" }, { status: 400 });
    }

    await connectToDB();

    await User.findByIdAndUpdate(auth.id, {
      $set: { pushSubscription: subscription },
    });

    return NextResponse.json({ message: "Subscription saved successfully" });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ message: "Error saving subscription" }, { status: 500 });
  }
}