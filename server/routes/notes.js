const express = require("express")
const Note = require("../models/Note")
const auth = require("../middleware/auth")
const { body, validationResult } = require("express-validator")

const router = express.Router()

// Get all notes for user
router.get("/", auth, async (req, res) => {
  try {
    const { search, tags, category, archived = false } = req.query
    const query = { author: req.user._id, isArchived: archived === "true" }

    if (search) {
      query.$text = { $search: search }
    }

    if (tags) {
      query.tags = { $in: tags.split(",") }
    }

    if (category && category !== "all") {
      query.category = category
    }

    const notes = await Note.find(query).sort({ isPinned: -1, updatedAt: -1 }).populate("linkedNotes", "title")

    res.json({ notes })
  } catch (error) {
    console.error("Get notes error:", error)
    res.status(500).json({ message: "Server error fetching notes" })
  }
})

// Get single note
router.get("/:id", auth, async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      author: req.user._id,
    }).populate("linkedNotes", "title")

    if (!note) {
      return res.status(404).json({ message: "Note not found" })
    }

    res.json({ note })
  } catch (error) {
    console.error("Get note error:", error)
    res.status(500).json({ message: "Server error fetching note" })
  }
})

// Create note
router.post(
  "/",
  auth,
  [
    body("title").trim().isLength({ min: 1, max: 200 }),
    body("content").trim().isLength({ min: 1 }),
    body("tags").optional().isArray(),
    body("category").optional().trim(),
    body("spacedRepetition.enabled").optional().isBoolean(),
    body("spacedRepetition.difficulty").optional().isInt({ min: 1, max: 5 }),
    body("spacedRepetition.interval").optional().isInt({ min: 1, max: 365 }),
  ],
  async (req, res) => {
    try {
      console.log("Creating note with data:", req.body)
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array())
        return res.status(400).json({ errors: errors.array() })
      }

      const noteData = {
        ...req.body,
        author: req.user._id,
      }

      // Initialize spaced repetition fields if enabled
      if (noteData.spacedRepetition?.enabled) {
        const nextReview = new Date()
        nextReview.setDate(nextReview.getDate() + (noteData.spacedRepetition.interval || 3))
        
        noteData.spacedRepetition = {
          ...noteData.spacedRepetition,
          nextReview,
          reviewCount: 0,
          lastReviewed: undefined,
        }
        
        console.log("Spaced repetition enabled, initialized with:", noteData.spacedRepetition)
      }

      console.log("Final note data:", noteData)
      const note = new Note(noteData)
      await note.save()

      console.log("Note created successfully:", note)
      res.status(201).json({ note })
    } catch (error) {
      console.error("Create note error:", error)
      res.status(500).json({ message: "Server error creating note" })
    }
  },
)

// Update note
router.put("/:id", auth, async (req, res) => {
  try {
    console.log("Updating note", req.params.id, "with data:", req.body)
    const updateData = { ...req.body }
    
    // Handle spaced repetition updates
    if (updateData.spacedRepetition?.enabled && !updateData.spacedRepetition.nextReview) {
      const nextReview = new Date()
      nextReview.setDate(nextReview.getDate() + (updateData.spacedRepetition.interval || 3))
      
      updateData.spacedRepetition = {
        ...updateData.spacedRepetition,
        nextReview,
        reviewCount: updateData.spacedRepetition.reviewCount || 0,
        lastReviewed: updateData.spacedRepetition.lastReviewed || undefined,
      }
      
      console.log("Spaced repetition updated:", updateData.spacedRepetition)
    }

    console.log("Final update data:", updateData)
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, author: req.user._id },
      { $set: updateData },
      { new: true, runValidators: true },
    )

    if (!note) {
      return res.status(404).json({ message: "Note not found" })
    }

    console.log("Note updated successfully:", note)
    res.json({ note })
  } catch (error) {
    console.error("Update note error:", error)
    res.status(500).json({ message: "Server error updating note" })
  }
})

// Delete note
router.delete("/:id", auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      author: req.user._id,
    })

    if (!note) {
      return res.status(404).json({ message: "Note not found" })
    }

    res.json({ message: "Note deleted successfully" })
  } catch (error) {
    console.error("Delete note error:", error)
    res.status(500).json({ message: "Server error deleting note" })
  }
})

// Get spaced repetition notes
router.get("/spaced-repetition/due", auth, async (req, res) => {
  try {
    const now = new Date()
    const notes = await Note.find({
      author: req.user._id,
      "spacedRepetition.enabled": true,
      "spacedRepetition.nextReview": { $lte: now },
    }).sort({ "spacedRepetition.nextReview": 1 })

    res.json({ notes })
  } catch (error) {
    console.error("Get spaced repetition notes error:", error)
    res.status(500).json({ message: "Server error fetching spaced repetition notes" })
  }
})

module.exports = router
