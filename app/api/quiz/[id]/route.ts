import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import { Quiz } from "@/models/Quiz";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    await connectToDB();

    const quiz = await Quiz.findOne({ _id: params.id, author: auth.id })
      .populate('sourceNote', 'title');

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("Get quiz error:", error);
    return NextResponse.json({ message: "Error fetching quiz" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    await connectToDB();

    const quiz = await Quiz.findOneAndDelete({ _id: params.id, author: auth.id });

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Delete quiz error:", error);
    return NextResponse.json({ message: "Error deleting quiz" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const updates = await req.json();

    await connectToDB();

    const quiz = await Quiz.findOneAndUpdate(
      { _id: params.id, author: auth.id },
      updates,
      { new: true }
    );

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("Update quiz error:", error);
    return NextResponse.json({ message: "Error updating quiz" }, { status: 500 });
  }
}
