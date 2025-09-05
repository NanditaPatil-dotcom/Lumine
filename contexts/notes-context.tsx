"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "./auth-context"

interface Note {
  _id: string
  title: string
  content: string
  author: string
  tags: string[]
  category: string
  isMarkdown: boolean
  spacedRepetition: {
    enabled: boolean
    difficulty: number
    nextReview?: Date
    reviewCount: number
    lastReviewed?: Date
    interval: number
  }
  aiGenerated: boolean
  linkedNotes: string[]
  position: {
    x: number
    y: number
  }
  isPinned: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

interface NotesContextType {
  notes: Note[]
  loading: boolean
  searchQuery: string
  selectedTags: string[]
  selectedCategory: string
  createNote: (noteData: Partial<Note>) => Promise<Note>
  updateNote: (id: string, updates: Partial<Note>) => Promise<Note>
  deleteNote: (id: string) => Promise<void>
  searchNotes: (query: string) => void
  filterByTags: (tags: string[]) => void
  filterByCategory: (category: string) => void
  togglePin: (id: string) => Promise<void>
  toggleArchive: (id: string) => Promise<void>
  refreshNotes: () => Promise<void>
  allTags: string[]
  categories: string[]
}

const NotesContext = createContext<NotesContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const { user } = useAuth()

  // Derived state
  const allTags = Array.from(new Set(notes.flatMap((note) => note.tags)))
  const categories = Array.from(new Set(notes.map((note) => note.category)))

  useEffect(() => {
    if (user) {
      refreshNotes()
    }
  }, [user])

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  }

  const refreshNotes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchQuery) params.append("search", searchQuery)
      if (selectedTags.length > 0) params.append("tags", selectedTags.join(","))
      if (selectedCategory !== "all") params.append("category", selectedCategory)

      const response = await fetch(`${API_BASE_URL}/notes?${params}`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes)
      }
    } catch (error) {
      console.error("Error fetching notes:", error)
    } finally {
      setLoading(false)
    }
  }

  const createNote = async (noteData: Partial<Note>): Promise<Note> => {
    console.log("Creating note with data:", noteData)
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(noteData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Failed to create note:", errorData)
      throw new Error("Failed to create note")
    }

    const data = await response.json()
    console.log("Note created successfully:", data.note)
    setNotes((prev) => [data.note, ...prev])
    return data.note
  }

  const updateNote = async (id: string, updates: Partial<Note>): Promise<Note> => {
    console.log("Updating note", id, "with data:", updates)
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Failed to update note:", errorData)
      throw new Error("Failed to update note")
    }

    const data = await response.json()
    console.log("Note updated successfully:", data.note)
    setNotes((prev) => prev.map((note) => (note._id === id ? data.note : note)))
    return data.note
  }

  const deleteNote = async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error("Failed to delete note")
    }

    setNotes((prev) => prev.filter((note) => note._id !== id))
  }

  const searchNotes = (query: string) => {
    setSearchQuery(query)
  }

  const filterByTags = (tags: string[]) => {
    setSelectedTags(tags)
  }

  const filterByCategory = (category: string) => {
    setSelectedCategory(category)
  }

  const togglePin = async (id: string) => {
    const note = notes.find((n) => n._id === id)
    if (note) {
      await updateNote(id, { isPinned: !note.isPinned })
    }
  }

  const toggleArchive = async (id: string) => {
    const note = notes.find((n) => n._id === id)
    if (note) {
      await updateNote(id, { isArchived: !note.isArchived })
    }
  }

  // Refresh notes when filters change
  useEffect(() => {
    if (user) {
      refreshNotes()
    }
  }, [searchQuery, selectedTags, selectedCategory])

  return (
    <NotesContext.Provider
      value={{
        notes,
        loading,
        searchQuery,
        selectedTags,
        selectedCategory,
        createNote,
        updateNote,
        deleteNote,
        searchNotes,
        filterByTags,
        filterByCategory,
        togglePin,
        toggleArchive,
        refreshNotes,
        allTags,
        categories,
      }}
    >
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() {
  const context = useContext(NotesContext)
  if (context === undefined) {
    throw new Error("useNotes must be used within a NotesProvider")
  }
  return context
}
