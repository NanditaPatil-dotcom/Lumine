import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { User } from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // Basic validation (mirrors express-validator intent)
    const errors: { field: string; message: string }[] = [];
    if (!email || typeof email !== "string") {
      errors.push({ field: "email", message: "Valid email is required" });
    }
    if (!password || typeof password !== "string") {
      errors.push({ field: "password", message: "Password is required" });
    }
    if (errors.length) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    await connectToDB();

    const user = await User.findOne({ email: (email as string).toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });
    }

    const token = signToken(user.id, "7d");

    return NextResponse.json({
      message: "Login successful",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Server error during login" }, { status: 500 });
  }
}