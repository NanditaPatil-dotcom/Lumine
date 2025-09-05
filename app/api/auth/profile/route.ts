import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import { User } from "@/models/User";

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const updates = await req.json();

    // Basic sanitization similar to express-validator intent
    const allowedRoot = ["profile", "preferences"];
    const filtered: any = {};
    for (const key of Object.keys(updates || {})) {
      if (allowedRoot.includes(key)) {
        filtered[key] = updates[key];
      }
    }

    await connectToDB();
    const user = await User.findByIdAndUpdate(auth.id, { $set: filtered }, { new: true, runValidators: true }).select("-password");

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ message: "Server error updating profile" }, { status: 500 });
  }
}