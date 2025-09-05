import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// POST /api/ai/enhance-note
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { content, enhancement } = await req.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json({ message: "Content is required" }, { status: 400 });
    }

    const desc =
      typeof enhancement === "string" && enhancement.trim().length > 0
        ? enhancement.trim()
        : "improving clarity, structure, and completeness";

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Enhance this content by ${desc}:

${content}

Please provide an improved version that is more clear, comprehensive, and well-structured.`;

    const result = await model.generateContent(prompt);
    const enhancedContent = result.response.text();

    return NextResponse.json({ enhancedContent });
  } catch (error) {
    console.error("Enhance note error:", error);
    return NextResponse.json({ message: "Error enhancing note with AI" }, { status: 500 });
  }
}