"use client"

import { useState } from "react"
import { ProtectedLayout } from "@/components/layout/protected-layout"
import { useNotes } from "@/contexts/notes-context"
import { NoteEditor } from "@/components/notes/note-editor"
import { NotesGrid } from "@/components/notes/notes-grid"
import { NotesFilters } from "@/components/notes/notes-filters"
import { Button } from "@/components/ui/button"
import { StudyTimer } from "@/components/notes/study-timer"
import { Plus, ArrowLeft } from "lucide-react"

interface Note {
  _id: string
  title: string
  content: string
  tags: string[]
  category: string
  isMarkdown: boolean
  spacedRepetition: {
    enabled: boolean
    difficulty: number
    nextReview?: Date
  }
  isPinned: boolean
  isArchived: boolean
  position: {
    x: number
    y: number
  }
  createdAt: string
  updatedAt: string
}

function NotesContent() {
  const { notes, loading, createNote, updateNote } = useNotes()
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateNote = () => {
    setEditingNote(null)
    setIsCreating(true)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setIsCreating(false)
  }

  const handleSaveNote = async (noteData: Partial<Note>) => {
    try {
      if (editingNote) {
        await updateNote(editingNote._id, noteData)
      } else {
        await createNote(noteData)
      }
      setEditingNote(null)
      setIsCreating(false)
    } catch (error) {
      console.error("Error saving note:", error)
      throw error
    }
  }

  const handleCancel = () => {
    setEditingNote(null)
    setIsCreating(false)
  }

  if (isCreating || editingNote) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4 p-6">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Notes
            </Button>
            <div>
              <h1 className="text-3xl font-serif font-bold">{editingNote ? "Edit Note" : "Create Note"}</h1>
              <p className="text-muted-foreground">
                {editingNote ? "Make changes to your note" : "Write your thoughts and ideas"}
              </p>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 p-6 overflow-hidden">
          <NoteEditor note={editingNote || undefined} onSave={handleSaveNote} onCancel={handleCancel} />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-serif font-bold">Notes</h1>
            <p className="text-muted-foreground">
              Organize and manage your knowledge
              {notes.length > 0 && (
                <span className="ml-2">
                  • {notes.length} note{notes.length !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StudyTimer />
            <Button onClick={handleCreateNote}>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <NotesFilters />

      {/* Notes Grid */}
      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <NotesGrid notes={notes} onEditNote={handleEditNote} />
        )}
      </div>
    </div>
  )
}

export default function NotesPage() {
  return (
    <ProtectedLayout>
      <NotesContent />
    </ProtectedLayout>
  )
}
