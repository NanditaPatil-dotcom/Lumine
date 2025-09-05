const express = require("express")
const { GoogleGenerativeAI } = require("@google/generative-ai")
const Note = require("../models/Note")
const Quiz = require("../models/Quiz")
const auth = require("../middleware/auth")

const router = express.Router()
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)

// Generate note from prompt
router.post("/generate-note", auth, async (req, res) => {
  try {
    const { prompt, category = "general" } = req.body

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const enhancedPrompt = `Create a comprehensive note based on this topic: "${prompt}". 
    Format the response as markdown with clear headings, bullet points, and structured content. 
    Make it educational and well-organized for studying purposes.`

    const result = await model.generateContent(enhancedPrompt)
    const content = result.response.text()

    // Extract title from content or use prompt
    const titleMatch = content.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1] : prompt.slice(0, 100)

    const note = new Note({
      title,
      content,
      author: req.user._id,
      category,
      aiGenerated: true,
      isMarkdown: true,
    })

    await note.save()

    res.json({ note })
  } catch (error) {
    console.error("Generate note error:", error)
    res.status(500).json({ message: "Error generating note with AI" })
  }
})

// Generate quiz from note (robust with JSON cleaning and offline fallback)
router.post("/generate-quiz/:noteId", auth, async (req, res) => {
  try {
    const { questionCount = 5, difficulty = 3 } = req.body;

    const count = Math.max(1, Math.min(20, Number(questionCount) || 5));
    const diff = Math.max(1, Math.min(5, Number(difficulty) || 3));

    const note = await Note.findOne({
      _id: req.params.noteId,
      author: req.user._id,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    // Helpers
    const stripCodeFences = (text) => {
      if (!text) return "";
      let t = String(text).trim();
      // remove ```json ... ``` or ``` ... ```
      t = t.replace(/^```json\s*/i, "").replace(/^```\s*/i, "");
      t = t.replace(/\s*```$/i, "");
      // try to extract JSON array/object if extra text exists
      const startIdx = t.indexOf("[");
      const endIdx = t.lastIndexOf("]");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        return t.slice(startIdx, endIdx + 1);
      }
      return t;
    };

    const coerceQuestionShape = (q) => {
      // Normalize fields and ensure schema compatibility
      const base = {
        question: String(q.question || "").trim() || "Answer the question based on the note content.",
        type: ["multiple-choice", "true-false", "short-answer", "flashcard"].includes(q.type)
          ? q.type
          : "short-answer",
        options: Array.isArray(q.options) ? q.options.slice(0, 6) : undefined,
        correctAnswer: typeof q.correctAnswer === "string" ? q.correctAnswer : "",
        explanation: typeof q.explanation === "string" ? q.explanation : "",
        difficulty: Math.max(1, Math.min(5, Number(q.difficulty) || diff)),
      };
      // For MCQ ensure options and correctAnswer presence
      if (base.type === "multiple-choice") {
        if (!base.options || base.options.length < 2) {
          base.options = ["Option A", "Option B", "Option C", "Option D"];
        }
        if (!base.correctAnswer) {
          base.correctAnswer = base.options[0];
        }
      }
      // For true-false normalize answers
      if (base.type === "true-false") {
        base.options = ["true", "false"];
        if (!base.correctAnswer || !["true", "false"].includes(String(base.correctAnswer).toLowerCase())) {
          base.correctAnswer = "true";
        } else {
          base.correctAnswer = String(base.correctAnswer).toLowerCase();
        }
      }
      return base;
    };

    const buildFallbackQuestions = (n, c, d) => {
      const qs = [];
      const catOptions = Array.from(new Set([n.category || "general", "general", "work", "study", "personal"]));
      // 1. Topic
      qs.push({
        question: `What is the main topic of the note titled "${n.title}"?`,
        type: "short-answer",
        correctAnswer: n.title,
        explanation: "This question checks recognition of the note's primary topic.",
        difficulty: d,
      });
      // 2. Category MCQ
      qs.push({
        question: `Which category does this note belong to?`,
        type: "multiple-choice",
        options: catOptions,
        correctAnswer: catOptions[0],
        explanation: "The first option is the note's saved category.",
        difficulty: d,
      });
      // 3. True/False about AI-generated
      qs.push({
        question: `True or False: This note was generated or enhanced by AI.`,
        type: "true-false",
        correctAnswer: n.aiGenerated ? "true" : "false",
        explanation: "Reflects the note's aiGenerated flag.",
        difficulty: d,
      });
      // 4. Detail recall
      qs.push({
        question: `Name one key concept or term mentioned in this note.`,
        type: "short-answer",
        correctAnswer: "",
        explanation: "Open-ended recall from the note content.",
        difficulty: d,
      });
      // 5. Application
      qs.push({
        question: `Provide one practical application or example related to this note's topic.`,
        type: "short-answer",
        correctAnswer: "",
        explanation: "Assesses ability to apply the concept.",
        difficulty: d,
      });

      // Trim or expand to requested count by repeating variants
      while (qs.length < c) {
        qs.push({
          question: `Summarize a key point from this note in one sentence.`,
          type: "short-answer",
          correctAnswer: "",
          explanation: "Checks concise understanding.",
          difficulty: d,
        });
      }
      return qs.slice(0, c);
    };

    let questions = [];

    // Try AI first, but don't fail the endpoint if model/key has issues
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `You are a quiz generator.
Return ONLY a strict JSON array (no code fences, no prose) of ${count} quiz questions about the provided note content.
Each element must match this TypeScript shape exactly:

type Question = {
 question: string;
 type: "multiple-choice" | "true-false" | "short-answer" | "flashcard";
 options?: string[];           // required for multiple-choice
 correctAnswer?: string;       // string literal for the correct option or short answer; for true-false use "true" or "false"
 explanation?: string;         // short explanation
 difficulty?: number;          // 1..5, default ${diff}
};

Constraints:
- Mix question types (MCQ, true-false, short-answer).
- For MCQ, provide 3-6 plausible options and set correctAnswer to one of them.
- Keep questions concise and unambiguous.
- Do not include markdown or backticks, return raw JSON only.

Note Title: ${note.title}
Note Category: ${note.category || "general"}
Note Content:
${String(note.content).slice(0, 6000)}
`;

      const result = await model.generateContent(prompt);
      const raw = result?.response?.text?.() ?? "";
      const cleaned = stripCodeFences(raw);
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        questions = parsed.map(coerceQuestionShape);
      }
    } catch (aiErr) {
      // If AI fails or returns invalid JSON, we'll fallback below.
      // console.warn("AI generation failed, using fallback:", aiErr?.message || aiErr);
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      questions = buildFallbackQuestions(note, count, diff);
    }

    const quiz = new Quiz({
      title: `Quiz: ${note.title}`,
      author: req.user._id,
      sourceNote: note._id,
      questions,
      aiGenerated: true,
    });

    await quiz.save();

    res.json({ quiz });
  } catch (error) {
    console.error("Generate quiz error:", error);
    res.status(500).json({ message: "Error generating quiz" });
  }
});

// Suggest spaced repetition schedule
router.post("/suggest-schedule/:noteId", auth, async (req, res) => {
  try {
    const { currentDifficulty, reviewHistory } = req.body

    const note = await Note.findOne({
      _id: req.params.noteId,
      author: req.user._id,
    })

    if (!note) {
      return res.status(404).json({ message: "Note not found" })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Based on spaced repetition principles and this note's difficulty (${currentDifficulty}/5), 
    suggest an optimal review schedule. Consider the note content complexity and user's review history.
    
    Note: ${note.title}
    Current difficulty: ${currentDifficulty}
    Review history: ${JSON.stringify(reviewHistory)}
    
    Return a JSON object with suggested intervals in days: {"intervals": [3, 7, 14, 30]}`

    const result = await model.generateContent(prompt)

    try {
      const suggestion = JSON.parse(result.response.text())
      res.json(suggestion)
    } catch (parseError) {
      // Fallback schedule
      const baseIntervals = [1, 3, 7, 14, 30]
      const adjustedIntervals = baseIntervals.map((interval) =>
        Math.max(1, Math.round((interval * (6 - currentDifficulty)) / 3)),
      )
      res.json({ intervals: adjustedIntervals })
    }
  } catch (error) {
    console.error("Suggest schedule error:", error)
    res.status(500).json({ message: "Error suggesting schedule with AI" })
  }
})

// Enhance note content
router.post("/enhance-note", auth, async (req, res) => {
  try {
    const { content, enhancement } = req.body

    if (!content) {
      return res.status(400).json({ message: "Content is required" })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Enhance this content by ${enhancement}:

${content}

Please provide an improved version that is more clear, comprehensive, and well-structured.`

    const result = await model.generateContent(prompt)
    const enhancedContent = result.response.text()

    res.json({ enhancedContent })
  } catch (error) {
    console.error("Enhance note error:", error)
    res.status(500).json({ message: "Error enhancing note with AI" })
  }
})

// Generate summary
router.post("/summarize", auth, async (req, res) => {
  try {
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ message: "Content is required" })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Create a concise summary of this content in 2-3 sentences:

${content}

Focus on the key points and main ideas.`

    const result = await model.generateContent(prompt)
    const summary = result.response.text()

    res.json({ summary })
  } catch (error) {
    console.error("Summarize error:", error)
    res.status(500).json({ message: "Error generating summary with AI" })
  }
})

// Generate tags
router.post("/generate-tags", auth, async (req, res) => {
  try {
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ message: "Content is required" })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Analyze this content and suggest 3-5 relevant tags:

${content}

Return only the tags as a comma-separated list, lowercase, no explanations.`

    const result = await model.generateContent(prompt)
    const tagsText = result.response.text()
    const tags = tagsText
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)

    res.json({ tags })
  } catch (error) {
    console.error("Generate tags error:", error)
    res.status(500).json({ message: "Error generating tags with AI" })
  }
})

module.exports = router
