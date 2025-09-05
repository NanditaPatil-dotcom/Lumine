import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectToDB } from "@/lib/db";
import { User, IUser } from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

export interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export function signToken(userId: string, expiresIn = "7d"): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function getTokenFromHeader(req: NextRequest): string | null {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth) return null;
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function getAuthUser(req: NextRequest): Promise<IUser | null> {
  const token = getTokenFromHeader(req);
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload?.userId) return null;

  await connectToDB();
  const user = await User.findById(payload.userId).select("-password");
  return user;
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ message }, { status: 401 });
}

export function badRequest(message = "Bad request", errors?: any) {
  return NextResponse.json({ message, errors }, { status: 400 });
}

export function serverError(message = "Internal server error") {
  return NextResponse.json({ message }, { status: 500 });
}

/**
 * Helper that enforces auth and returns either a NextResponse (401) or the IUser.
 * Usage in route handlers:
 *   const auth = await requireAuth(req);
 *   if (auth instanceof NextResponse) return auth;
 *   const user = auth; // IUser
 */
export async function requireAuth(req: NextRequest): Promise<IUser | NextResponse> {
  const user = await getAuthUser(req);
  if (!user) return unauthorized("No token provided or token invalid");
  return user;
}