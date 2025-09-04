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

// Generate quiz from note
router.post("/generate-quiz/:noteId", auth, async (req, res) => {
  try {
    const { questionCount = 5, difficulty = 3 } = req.body

    const note = await Note.findOne({
      _id: req.params.noteId,
      author: req.user._id,
    })

    if (!note) {
      return res.status(404).json({ message: "Note not found" })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Based on this note content, create ${questionCount} quiz questions:

Title: ${note.title}
Content: ${note.content}

Generate questions with difficulty level ${difficulty}/5. Return a JSON array with this structure:
[
  {
    "question": "Question text",
    "type": "multiple-choice",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "explanation": "Why this is correct"
  }
]

Mix question types: multiple-choice, true-false, and short-answer.`

    const result = await model.generateContent(prompt)
    let questions

    try {
      questions = JSON.parse(result.response.text())
    } catch (parseError) {
      // Fallback if JSON parsing fails
      questions = [
        {
          question: `What is the main topic of: ${note.title}?`,
          type: "short-answer",
          correctAnswer: note.title,
          explanation: "Based on the note title and content",
        },
      ]
    }

    const quiz = new Quiz({
      title: `Quiz: ${note.title}`,
      author: req.user._id,
      sourceNote: note._id,
      questions,
      aiGenerated: true,
    })

    await quiz.save()

    res.json({ quiz })
  } catch (error) {
    console.error("Generate quiz error:", error)
    res.status(500).json({ message: "Error generating quiz with AI" })
  }
})

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
