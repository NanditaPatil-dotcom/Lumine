import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// POST /api/ai/summarize
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { content } = await req.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json({ message: "Content is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Create a concise summary of this content in 2-3 sentences:

${content}

Focus on the key points and main ideas.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json({ message: "Error generating summary with AI" }, { status: 500 });
  }
}