const express = require("express")
const Note = require("../models/Note")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Get review statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const userId = req.user._id
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get total reviews (this would need a separate ReviewSession model in a real app)
    const totalNotes = await Note.countDocuments({
      author: userId,
      "spacedRepetition.enabled": true,
    })

    // Get reviews today (simplified - in real app, track actual review sessions)
    const reviewsToday = await Note.countDocuments({
      author: userId,
      "spacedRepetition.enabled": true,
      "spacedRepetition.lastReviewed": {
        $gte: today,
        $lt: tomorrow,
      },
    })

    // Get due notes count
    const dueToday = await Note.countDocuments({
      author: userId,
      "spacedRepetition.enabled": true,
      "spacedRepetition.nextReview": { $lte: new Date() },
    })

    // Calculate streak (simplified)
    const user = await User.findById(userId)
    const streak = user.preferences?.spacedRepetition?.streak || 0

    const stats = {
      totalReviews: totalNotes * 3, // Simplified calculation
      streak: streak,
      accuracy: 85, // This would be calculated from actual review data
      averageResponseTime: 4500, // This would be calculated from actual review data
      reviewsToday: reviewsToday,
      dueToday: dueToday,
    }

    res.json({ stats })
  } catch (error) {
    console.error("Get stats error:", error)
    res.status(500).json({ message: "Error fetching review statistics" })
  }
})

// Submit a review
router.post("/review", auth, async (req, res) => {
  try {
    const { noteId, quality, responseTime } = req.body
    const userId = req.user._id

    const note = await Note.findOne({ _id: noteId, author: userId })
    if (!note) {
      return res.status(404).json({ message: "Note not found" })
    }

    // SM-2 Algorithm implementation
    let interval = note.spacedRepetition.interval || 1
    let difficulty = note.spacedRepetition.difficulty || 2.5
    let reviewCount = note.spacedRepetition.reviewCount || 0

    if (quality >= 3) {
      // Correct response
      if (reviewCount === 0) {
        interval = 1
      } else if (reviewCount === 1) {
        interval = 6
      } else {
        interval = Math.round(interval * difficulty)
      }
      reviewCount += 1
    } else {
      // Incorrect response - reset
      reviewCount = 0
      interval = 1
    }

    // Update difficulty factor
    difficulty = difficulty + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    difficulty = Math.max(1.3, difficulty)

    // Calculate next review date
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + interval)

    // Update note
    await Note.findByIdAndUpdate(noteId, {
      $set: {
        "spacedRepetition.interval": interval,
        "spacedRepetition.difficulty": difficulty,
        "spacedRepetition.reviewCount": reviewCount,
        "spacedRepetition.lastReviewed": new Date(),
        "spacedRepetition.nextReview": nextReview,
      },
    })

    // Update user streak (simplified)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const user = await User.findById(userId)
    if (!user.preferences) {
      user.preferences = {}
    }
    if (!user.preferences.spacedRepetition) {
      user.preferences.spacedRepetition = { streak: 0 }
    }
    
    const lastReviewDate = user.preferences.spacedRepetition.lastReviewDate
    let newStreak = user.preferences.spacedRepetition.streak || 0

    if (!lastReviewDate || lastReviewDate < today) {
      // First review of the day
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      if (lastReviewDate && lastReviewDate.getTime() === yesterday.getTime()) {
        newStreak += 1
      } else if (!lastReviewDate || lastReviewDate < yesterday) {
        newStreak = 1
      }

      await User.findByIdAndUpdate(userId, {
        $set: {
          "preferences.spacedRepetition.streak": newStreak,
          "preferences.spacedRepetition.lastReviewDate": today,
        },
      })
    }

    res.json({
      message: "Review submitted successfully",
      nextReview: nextReview,
      interval: interval,
      difficulty: difficulty,
    })
  } catch (error) {
    console.error("Submit review error:", error)
    res.status(500).json({ message: "Error submitting review" })
  }
})

// Skip a note (postpone review)
router.post("/skip", auth, async (req, res) => {
  try {
    const { noteId } = req.body
    const userId = req.user._id

    const note = await Note.findOne({ _id: noteId, author: userId })
    if (!note) {
      return res.status(404).json({ message: "Note not found" })
    }

    // Postpone review by 1 day
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + 1)

    await Note.findByIdAndUpdate(noteId, {
      $set: {
        "spacedRepetition.nextReview": nextReview,
      },
    })

    res.json({ message: "Note skipped successfully" })
  } catch (error) {
    console.error("Skip note error:", error)
    res.status(500).json({ message: "Error skipping note" })
  }
})

module.exports = router
