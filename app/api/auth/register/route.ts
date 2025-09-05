export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { User } from "@/models/User";
import { signToken } from "@/lib/auth";

function collectValidationErrors(username: unknown, email: unknown, password: unknown) {
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

  return errors;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username, email, password } = body || {};

    // Basic validation (parity with express-validator intent)
    const errors = collectValidationErrors(username, email, password);
    if (errors.length) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    await connectToDB();

    // Ensure indexes (including unique) are built before operations that rely on them
    await User.init();

    const cleanUsername = String(username).trim();
    const cleanEmail = String(email).toLowerCase().trim();

    // Unique checks (extra safety alongside unique index)
    const existingUser = await User.findOne({
      $or: [{ email: cleanEmail }, { username: cleanUsername }],
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    const user = new User({
      username: cleanUsername,
      email: cleanEmail,
      password,
    });

    try {
      await user.save();
    } catch (err: any) {
      // Duplicate key error (if unique index triggers here)
      if (err?.code === 11000) {
        return NextResponse.json(
          { message: "User with this email or username already exists" },
          { status: 400 }
        );
      }

      // Mongoose validation error
      if (err?.name === "ValidationError") {
        const details = Object.values(err.errors || {}).map((e: any) => ({
          field: e?.path || "unknown",
          message: e?.message || "Invalid value",
        }));
        return NextResponse.json({ message: "Validation failed", errors: details }, { status: 400 });
      }

      console.error("Registration save error:", err);
      return NextResponse.json({ message: "Server error during registration" }, { status: 500 });
    }

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
    console.error("Registration error (outer):", error);
    return NextResponse.json(
      { message: "Server error during registration" },
      { status: 500 }
    );
  }
}