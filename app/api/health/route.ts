import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";

export const runtime = "nodejs";

// GET /api/health
export async function GET() {
  const result: any = {
    status: "starting",
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    hasMongoUri: Boolean(process.env.MONGODB_URI),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    hasGoogleKey: Boolean(process.env.GOOGLE_API_KEY),
    hasVapidKeys: Boolean(process.env.VAPID_PUBLIC_KEY) && Boolean(process.env.VAPID_PRIVATE_KEY),
  };

  try {
    const conn = await connectToDB();
    // @ts-ignore mongoose v8 connection state
    // If available, include connection name/db name
    const connections = (conn as any).connections || [];
    const primary = connections[0];
    result.db = {
      ok: true,
      host: primary?.host,
      name: primary?.name,
      readyState: primary?.readyState, // 1 when connected
    };
    result.status = "OK";
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    result.db = {
      ok: false,
      error: err?.message || String(err),
    };
    result.status = "DB_ERROR";
    return NextResponse.json(result, { status: 500 });
  }
}