"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"
import { Inter } from "next/font/google"



interface CalendarEvent {
  id: string
  title: string
  description?: string
  date: Date
  time?: string
  type: "study" | "review" | "reminder" | "custom"
  noteId?: string
  duration?: number
  completed?: boolean
}

interface CalendarContextType {
  events: CalendarEvent[]
  currentDate: Date
  selectedDate: Date | null
  loading: boolean
  error: string | null
  setCurrentDate: (date: Date) => void
  setSelectedDate: (date: Date | null) => void
  createEvent: (event: Omit<CalendarEvent, "id">) => Promise<void>
  createSpacedRepetitionEvent: (noteId: string, noteTitle: string, nextReviewDate: Date, interval: number) => Promise<void>
  removeSpacedRepetitionEvents: (noteId: string) => Promise<void>
  updateCalendarEvent: (noteId: string, nextReviewDate: Date | undefined) => Promise<void>
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  getEventsForDate: (date: Date) => CalendarEvent[]
  getUpcomingEvents: (days?: number) => CalendarEvent[]
  markEventCompleted: (id: string) => Promise<void>
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined)

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

  useEffect(() => {
    if (user && token) {
      fetchEvents()
    }
  }, [user, token])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/calendar/events`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) throw new Error("Failed to fetch events")

      const data = await response.json()
      setEvents(
        data.map((event: any) => ({
          ...event,
          date: new Date(event.date),
        })),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch events")
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async (eventData: Omit<CalendarEvent, "id">) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/calendar/events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) throw new Error("Failed to create event")

      const newEvent = await response.json()
      setEvents((prev) => [...prev, { ...newEvent, date: new Date(newEvent.date) }])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const createSpacedRepetitionEvent = async (noteId: string, noteTitle: string, nextReviewDate: Date, interval: number) => {
    try {
      const eventData = {
        title: `Review: ${noteTitle}`,
        description: `Spaced repetition review for note: ${noteTitle}`,
        date: nextReviewDate,
        type: "review" as const,
        noteId,
        duration: 15, // 15 minutes for review
      }

      await createEvent(eventData)
    } catch (error) {
      console.error("Error creating spaced repetition event:", error)
    }
  }

  const removeSpacedRepetitionEvents = async (noteId: string) => {
    try {
      // Find and remove all events related to this note
      const eventsToRemove = events.filter(event => event.noteId === noteId && event.type === "review")
      
      for (const event of eventsToRemove) {
        await deleteEvent(event.id)
      }
    } catch (error) {
      console.error("Error removing spaced repetition events:", error)
    }
  }

  const updateCalendarEvent = async (noteId: string, nextReviewDate: Date | undefined) => {
    try {
      if (nextReviewDate) {
        // Update or create calendar event for the note
        const existingEvent = events.find(event => event.noteId === noteId && event.type === "review")
        
        if (existingEvent) {
          // Update existing event
          await updateEvent(existingEvent.id, { date: nextReviewDate })
        } else {
          // Create new event
          const note = events.find(event => event.noteId === noteId)
          if (note) {
            await createSpacedRepetitionEvent(noteId, note.title, nextReviewDate, 3)
          }
        }
      } else {
        // Remove calendar event
        await removeSpacedRepetitionEvents(noteId)
      }
    } catch (error) {
      console.error("Error updating calendar event:", error)
    }
  }

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/calendar/events/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update event")

      const updatedEvent = await response.json()
      setEvents((prev) =>
        prev.map((event) => (event.id === id ? { ...updatedEvent, date: new Date(updatedEvent.date) } : event)),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/api/calendar/events/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to delete event")

      setEvents((prev) => prev.filter((event) => event.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => event.date.toDateString() === date.toDateString())
  }

  const getUpcomingEvents = (days = 7) => {
    const now = new Date()
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    return events
      .filter((event) => event.date >= now && event.date <= futureDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  const markEventCompleted = async (id: string) => {
    await updateEvent(id, { completed: true })
  }

  return (
    <CalendarContext.Provider
      value={{
        events,
        currentDate,
        selectedDate,
        loading,
        error,
        setCurrentDate,
        setSelectedDate,
        createEvent,
        createSpacedRepetitionEvent,
        removeSpacedRepetitionEvents,
        updateCalendarEvent,
        updateEvent,
        deleteEvent,
        getEventsForDate,
        getUpcomingEvents,
        markEventCompleted,
      }}
    >
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendar() {
  const context = useContext(CalendarContext)
  if (context === undefined) {
    throw new Error("useCalendar must be used within a CalendarProvider")
  }
  return context
}
