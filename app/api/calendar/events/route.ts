import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { addEvent, getUserEvents, CalendarEvent } from "@/lib/calendar-store";

// GET /api/calendar/events - list user's events
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const events = getUserEvents(auth.id);
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// POST /api/calendar/events - create new event
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { title, description, date, time, type, noteId, duration } = await req.json();

    if (!title || !date) {
      return NextResponse.json({ message: "Title and date are required" }, { status: 400 });
    }

    const now = new Date();
    const event: CalendarEvent = {
      id: Date.now().toString(),
      userId: auth.id,
      title: String(title),
      description: typeof description === "string" ? description : "",
      date: new Date(date),
      time: typeof time === "string" ? time : null,
      type: typeof type === "string" ? type : "custom",
      noteId: typeof noteId === "string" ? noteId : null,
      duration: typeof duration === "number" ? duration : 30,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    addEvent(event);
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}