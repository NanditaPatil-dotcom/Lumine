import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { findEventById, updateEvent, deleteEvent } from "@/lib/calendar-store";

// PUT /api/calendar/events/[id] - update event
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const updates = await req.json();
    const event = findEventById(params.id, auth.id);
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    const normalized = {
      ...updates,
      date: updates.date ? new Date(updates.date) : undefined,
      updatedAt: new Date(),
    };

    const updated = updateEvent(params.id, auth.id, normalized);
    if (!updated) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

// DELETE /api/calendar/events/[id] - delete event
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const existed = deleteEvent(params.id, auth.id);
    if (!existed) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}