const express = require("express")
const webpush = require("web-push")
const User = require("../models/User")
const Note = require("../models/Note")
const auth = require("../middleware/auth")

const router = express.Router()

// Configure web push
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
)

// Subscribe to push notifications
router.post("/subscribe", auth, async (req, res) => {
  try {
    const { subscription } = req.body

    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription: subscription,
    })

    res.json({ message: "Subscription saved successfully" })
  } catch (error) {
    console.error("Subscribe error:", error)
    res.status(500).json({ message: "Error saving subscription" })
  }
})

// Send test notification
router.post("/test", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user.pushSubscription) {
      return res.status(400).json({ message: "No push subscription found" })
    }

    const payload = JSON.stringify({
      title: "Lumine Test",
      body: "Push notifications are working!",
      icon: "/icon-192x192.png",
    })

    await webpush.sendNotification(user.pushSubscription, payload)

    res.json({ message: "Test notification sent" })
  } catch (error) {
    console.error("Test notification error:", error)
    res.status(500).json({ message: "Error sending test notification" })
  }
})

// Send spaced repetition reminders
router.post("/send-reminders", auth, async (req, res) => {
  try {
    const now = new Date()
    const users = await User.find({
      "preferences.notifications.webPush": true,
      pushSubscription: { $exists: true },
    })

    let sentCount = 0

    for (const user of users) {
      const dueNotes = await Note.find({
        author: user._id,
        "spacedRepetition.enabled": true,
        "spacedRepetition.nextReview": { $lte: now },
      }).limit(5)

      if (dueNotes.length > 0) {
        const payload = JSON.stringify({
          title: "Time to Review!",
          body: `You have ${dueNotes.length} note${dueNotes.length > 1 ? "s" : ""} ready for review`,
          icon: "/icon-192x192.png",
          badge: "/badge-72x72.png",
          data: {
            url: "/notes?filter=due",
          },
        })

        try {
          await webpush.sendNotification(user.pushSubscription, payload)
          sentCount++
        } catch (pushError) {
          console.error(`Failed to send notification to user ${user._id}:`, pushError)
          // Remove invalid subscription
          if (pushError.statusCode === 410) {
            await User.findByIdAndUpdate(user._id, {
              $unset: { pushSubscription: 1 },
            })
          }
        }
      }
    }

    res.json({ message: `Sent ${sentCount} reminder notifications` })
  } catch (error) {
    console.error("Send reminders error:", error)
    res.status(500).json({ message: "Error sending reminder notifications" })
  }
})

module.exports = router
