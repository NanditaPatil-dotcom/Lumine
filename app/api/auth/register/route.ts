import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { User } from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, email, password } = await req.json();

    // Basic validation (parity with express-validator intent)
    const errors: { field: string; message: string }[] = [];
    if (!username || typeof username !== "string" || username.trim().length < 3) {
      errors.push({ field: "username", message: "Username must be at least 3 characters" });
    }
    if (
      !email ||
      typeof email !== "string" ||
      !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)
    ) {
      errors.push({ field: "email", message: "Valid email is required" });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      errors.push({ field: "password", message: "Password must be at least 6 characters" });
    }
    if (errors.length) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    await connectToDB();

    // Unique checks
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { username: username.trim() }],
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    const user = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    await user.save();

    const token = signToken(user.id, "7d");

    return NextResponse.json(
      {
        message: "User created successfully",
        token,
        user: user.toJSON(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Server error during registration" },
      { status: 500 }
    );
  }
}