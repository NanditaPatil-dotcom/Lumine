import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { connectToDB } from "@/lib/db";
import { Note } from "@/models/Note";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { prompt, category = "general" } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ message: "Prompt is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const enhancedPrompt = `Create a comprehensive note based on this topic: "${prompt}". 
Format the response as markdown with clear headings, bullet points, and structured content. 
Make it educational and well-organized for studying purposes.`;

    const result = await model.generateContent(enhancedPrompt);
    const content = result.response.text();

    // Extract title from content or use prompt
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : String(prompt).slice(0, 100);

    await connectToDB();

    const note = await Note.create({
      title,
      content,
      author: auth.id,
      category,
      aiGenerated: true,
      isMarkdown: true,
    });

    return NextResponse.json({ note }, { status: 200 });
  } catch (error) {
    console.error("Generate note error:", error);
    return NextResponse.json({ message: "Error generating note with AI" }, { status: 500 });
  }
}