"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, BookOpen, Bell, User } from "lucide-react"
import { useCalendar } from "@/contexts/calendar-context"
import { useNotes } from "@/contexts/notes-context"

interface EventDialogProps {
  children: React.ReactNode
  selectedDate?: Date
  onClose?: () => void
}

export function EventDialog({ children, selectedDate, onClose }: EventDialogProps) {
  const { createEvent } = useCalendar()
  const { notes } = useNotes()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: selectedDate ? selectedDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    time: "",
    type: "custom" as "study" | "review" | "reminder" | "custom",
    noteId: "",
    duration: 30,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    try {
      setLoading(true)
      const eventDate = new Date(formData.date)
      if (formData.time) {
        const [hours, minutes] = formData.time.split(":")
        eventDate.setHours(Number.parseInt(hours), Number.parseInt(minutes))
      }

      await createEvent({
        title: formData.title,
        description: formData.description,
        date: eventDate,
        time: formData.time,
        type: formData.type,
        noteId: formData.noteId || undefined,
        duration: formData.duration,
      })

      setFormData({
        title: "",
        description: "",
        date: selectedDate ? selectedDate.toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        time: "",
        type: "custom",
        noteId: "",
        duration: 30,
      })
      setOpen(false)
      onClose?.()
    } catch (error) {
      console.error("Failed to create event:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "study":
        return <BookOpen className="h-4 w-4" />
      case "review":
        return <Calendar className="h-4 w-4" />
      case "reminder":
        return <Bell className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Event title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Event description (optional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData((prev) => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="study">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Study Session
                  </div>
                </SelectItem>
                <SelectItem value="review">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Review Session
                  </div>
                </SelectItem>
                <SelectItem value="reminder">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Reminder
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Custom Event
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.type === "study" || formData.type === "review") && (
            <div className="space-y-2">
              <Label htmlFor="noteId">Related Note</Label>
              <Select
                value={formData.noteId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, noteId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a note (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {notes.map((note) => (
                    <SelectItem key={note.id} value={note.id}>
                      {note.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="5"
              max="480"
              value={formData.duration}
              onChange={(e) => setFormData((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) }))}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
