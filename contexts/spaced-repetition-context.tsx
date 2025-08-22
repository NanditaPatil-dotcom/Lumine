"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth-context"

interface ReviewSession {
  noteId: string
  difficulty: number
  quality: number // 0-5 rating of how well remembered
  responseTime: number
  timestamp: Date
}

interface SpacedRepetitionStats {
  totalReviews: number
  streak: number
  accuracy: number
  averageResponseTime: number
  reviewsToday: number
  dueToday: number
}

interface SpacedRepetitionContextType {
  dueNotes: any[]
  reviewStats: SpacedRepetitionStats
  loading: boolean
  currentReviewSession: any[]
  sessionProgress: number
  startReviewSession: () => Promise<void>
  submitReview: (noteId: string, quality: number, responseTime: number) => Promise<void>
  skipNote: (noteId: string) => Promise<void>
  endSession: () => void
  refreshDueNotes: () => Promise<void>
  getNextReviewDate: (difficulty: number, quality: number, interval: number) => Date
}

const SpacedRepetitionContext = createContext<SpacedRepetitionContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export function SpacedRepetitionProvider({ children }: { children: React.ReactNode }) {
  const [dueNotes, setDueNotes] = useState<any[]>([])
  const [reviewStats, setReviewStats] = useState<SpacedRepetitionStats>({
    totalReviews: 0,
    streak: 0,
    accuracy: 0,
    averageResponseTime: 0,
    reviewsToday: 0,
    dueToday: 0,
  })
  const [loading, setLoading] = useState(true)
  const [currentReviewSession, setCurrentReviewSession] = useState<any[]>([])
  const [sessionProgress, setSessionProgress] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      refreshDueNotes()
      loadReviewStats()
    }
  }, [user])

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  }

  const refreshDueNotes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/notes/spaced-repetition/due`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setDueNotes(data.notes)
        setReviewStats((prev) => ({ ...prev, dueToday: data.notes.length }))
      }
    } catch (error) {
      console.error("Error fetching due notes:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadReviewStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/spaced-repetition/stats`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setReviewStats(data.stats)
      }
    } catch (error) {
      console.error("Error loading review stats:", error)
    }
  }

  const startReviewSession = async () => {
    const sessionNotes = dueNotes.slice(0, Math.min(20, dueNotes.length)) // Limit to 20 notes per session
    setCurrentReviewSession(sessionNotes)
    setSessionProgress(0)
  }

  const submitReview = async (noteId: string, quality: number, responseTime: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/spaced-repetition/review`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          noteId,
          quality,
          responseTime,
        }),
      })

      if (response.ok) {
        // Update session progress
        setSessionProgress((prev) => prev + 1)

        // Remove reviewed note from due notes
        setDueNotes((prev) => prev.filter((note) => note._id !== noteId))

        // Update stats
        setReviewStats((prev) => ({
          ...prev,
          totalReviews: prev.totalReviews + 1,
          reviewsToday: prev.reviewsToday + 1,
          dueToday: prev.dueToday - 1,
        }))
      }
    } catch (error) {
      console.error("Error submitting review:", error)
    }
  }

  const skipNote = async (noteId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/spaced-repetition/skip`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ noteId }),
      })

      if (response.ok) {
        setSessionProgress((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Error skipping note:", error)
    }
  }

  const endSession = () => {
    setCurrentReviewSession([])
    setSessionProgress(0)
    refreshDueNotes()
    loadReviewStats()
  }

  // SM-2 Algorithm implementation
  const getNextReviewDate = (difficulty: number, quality: number, interval: number): Date => {
    let newInterval = interval
    let newDifficulty = difficulty

    if (quality >= 3) {
      // Correct response
      if (interval === 0) {
        newInterval = 1
      } else if (interval === 1) {
        newInterval = 6
      } else {
        newInterval = Math.round(interval * newDifficulty)
      }
    } else {
      // Incorrect response
      newInterval = 1
    }

    // Update difficulty factor
    newDifficulty = newDifficulty + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    newDifficulty = Math.max(1.3, newDifficulty)

    const nextReviewDate = new Date()
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval)

    return nextReviewDate
  }

  return (
    <SpacedRepetitionContext.Provider
      value={{
        dueNotes,
        reviewStats,
        loading,
        currentReviewSession,
        sessionProgress,
        startReviewSession,
        submitReview,
        skipNote,
        endSession,
        refreshDueNotes,
        getNextReviewDate,
      }}
    >
      {children}
    </SpacedRepetitionContext.Provider>
  )
}

export function useSpacedRepetition() {
  const context = useContext(SpacedRepetitionContext)
  if (context === undefined) {
    throw new Error("useSpacedRepetition must be used within a SpacedRepetitionProvider")
  }
  return context
}
