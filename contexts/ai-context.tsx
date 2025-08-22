"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import { useAuth } from "./auth-context"

interface Quiz {
  _id: string
  title: string
  description: string
  questions: {
    question: string
    type: "multiple-choice" | "true-false" | "short-answer" | "flashcard"
    options?: string[]
    correctAnswer: string
    explanation: string
    difficulty: number
  }[]
  sourceNote?: string
  aiGenerated: boolean
  createdAt: string
}

interface AIContextType {
  loading: boolean
  generateNote: (prompt: string, category?: string) => Promise<any>
  generateQuiz: (noteId: string, questionCount?: number, difficulty?: number) => Promise<Quiz>
  suggestSchedule: (noteId: string, currentDifficulty: number, reviewHistory: any[]) => Promise<any>
  enhanceNote: (content: string, enhancement: string) => Promise<string>
  generateSummary: (content: string) => Promise<string>
  generateTags: (content: string) => Promise<string[]>
}

const AIContext = createContext<AIContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  }

  const generateNote = async (prompt: string, category = "general") => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/ai/generate-note`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ prompt, category }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate note")
      }

      const data = await response.json()
      return data.note
    } catch (error) {
      console.error("Error generating note:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const generateQuiz = async (noteId: string, questionCount = 5, difficulty = 3): Promise<Quiz> => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/ai/generate-quiz/${noteId}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ questionCount, difficulty }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate quiz")
      }

      const data = await response.json()
      return data.quiz
    } catch (error) {
      console.error("Error generating quiz:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const suggestSchedule = async (noteId: string, currentDifficulty: number, reviewHistory: any[]) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/ai/suggest-schedule/${noteId}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentDifficulty, reviewHistory }),
      })

      if (!response.ok) {
        throw new Error("Failed to suggest schedule")
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error suggesting schedule:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const enhanceNote = async (content: string, enhancement: string): Promise<string> => {
    setLoading(true)
    try {
      // This would be a new endpoint for enhancing notes
      const response = await fetch(`${API_BASE_URL}/ai/enhance-note`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ content, enhancement }),
      })

      if (!response.ok) {
        throw new Error("Failed to enhance note")
      }

      const data = await response.json()
      return data.enhancedContent
    } catch (error) {
      console.error("Error enhancing note:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const generateSummary = async (content: string): Promise<string> => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/ai/summarize`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate summary")
      }

      const data = await response.json()
      return data.summary
    } catch (error) {
      console.error("Error generating summary:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const generateTags = async (content: string): Promise<string[]> => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/ai/generate-tags`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate tags")
      }

      const data = await response.json()
      return data.tags
    } catch (error) {
      console.error("Error generating tags:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AIContext.Provider
      value={{
        loading,
        generateNote,
        generateQuiz,
        suggestSchedule,
        enhanceNote,
        generateSummary,
        generateTags,
      }}
    >
      {children}
    </AIContext.Provider>
  )
}

export function useAI() {
  const context = useContext(AIContext)
  if (context === undefined) {
    throw new Error("useAI must be used within an AIProvider")
  }
  return context
}
