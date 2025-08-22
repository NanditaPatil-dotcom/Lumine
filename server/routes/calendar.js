const express = require("express")
const router = express.Router()
const auth = require("../middleware/auth")

// Calendar Event Schema (in-memory for demo - use MongoDB in production)
const events = []

// Get all events for user
router.get("/events", auth, async (req, res) => {
  try {
    const userEvents = events.filter((event) => event.userId === req.user.userId)
    res.json(userEvents)
  } catch (error) {
    console.error("Error fetching events:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create new event
router.post("/events", auth, async (req, res) => {
  try {
    const { title, description, date, time, type, noteId, duration } = req.body

    if (!title || !date) {
      return res.status(400).json({ message: "Title and date are required" })
    }

    const newEvent = {
      id: Date.now().toString(),
      userId: req.user.userId,
      title,
      description: description || "",
      date: new Date(date),
      time: time || null,
      type: type || "custom",
      noteId: noteId || null,
      duration: duration || 30,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    events.push(newEvent)
    res.status(201).json(newEvent)
  } catch (error) {
    console.error("Error creating event:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update event
router.put("/events/:id", auth, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const eventIndex = events.findIndex((event) => event.id === id && event.userId === req.user.userId)

    if (eventIndex === -1) {
      return res.status(404).json({ message: "Event not found" })
    }

    events[eventIndex] = {
      ...events[eventIndex],
      ...updates,
      updatedAt: new Date(),
    }

    res.json(events[eventIndex])
  } catch (error) {
    console.error("Error updating event:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete event
router.delete("/events/:id", auth, async (req, res) => {
  try {
    const { id } = req.params

    const eventIndex = events.findIndex((event) => event.id === id && event.userId === req.user.userId)

    if (eventIndex === -1) {
      return res.status(404).json({ message: "Event not found" })
    }

    events.splice(eventIndex, 1)
    res.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Error deleting event:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get events for specific date range
router.get("/events/range", auth, async (req, res) => {
  try {
    const { start, end } = req.query

    if (!start || !end) {
      return res.status(400).json({ message: "Start and end dates are required" })
    }

    const startDate = new Date(start)
    const endDate = new Date(end)

    const userEvents = events.filter(
      (event) => event.userId === req.user.userId && event.date >= startDate && event.date <= endDate,
    )

    res.json(userEvents)
  } catch (error) {
    console.error("Error fetching events by range:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
