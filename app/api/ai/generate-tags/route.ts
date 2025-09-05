import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// POST /api/ai/generate-tags
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { content } = await req.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json({ message: "Content is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this content and suggest 3-5 relevant tags:

${content}

Return only the tags as a comma-separated list, lowercase, no explanations.`;

    const result = await model.generateContent(prompt);
    const tagsText = result.response.text();
    const tags = tagsText
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Generate tags error:", error);
    return NextResponse.json({ message: "Error generating tags with AI" }, { status: 500 });
  }
}