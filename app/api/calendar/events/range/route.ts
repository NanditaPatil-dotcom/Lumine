import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getEventsInRange } from "@/lib/calendar-store";

// GET /api/calendar/events/range?start=ISO&end=ISO
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const start = req.nextUrl.searchParams.get("start");
    const end = req.nextUrl.searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json({ message: "Start and end dates are required" }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ message: "Invalid date range" }, { status: 400 });
    }

    const events = getEventsInRange(auth.id, startDate, endDate);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events by range:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}