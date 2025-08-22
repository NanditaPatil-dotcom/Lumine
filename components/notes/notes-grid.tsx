"use client"
import { useState } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { NoteCard } from "./note-card"
import { useNotes } from "@/contexts/notes-context"
import { cn } from "@/lib/utils"

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

interface NotesGridProps {
  notes: Note[]
  onEditNote: (note: Note) => void
}

export function NotesGrid({ notes, onEditNote }: NotesGridProps) {
  const { deleteNote, togglePin, toggleArchive, updateNote } = useNotes()
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null)
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number } | null>(null)

  const handleToggleSpacedRepetition = async (id: string, enabled: boolean) => {
    try {
      const note = notes.find(n => n._id === id)
      if (!note) return

      const updateData = {
        spacedRepetition: {
          ...note.spacedRepetition,
          enabled,
          // If enabling, set initial values
          ...(enabled && {
            difficulty: note.spacedRepetition.difficulty || 3,
            interval: note.spacedRepetition.interval || 3,
            reviewCount: 0,
            nextReview: (() => {
              const nextReview = new Date()
              nextReview.setDate(nextReview.getDate() + (note.spacedRepetition.interval || 3))
              return nextReview
            })(),
            lastReviewed: undefined,
          })
        }
      }

      await updateNote(id, updateData)
    } catch (error) {
      console.error("Error toggling spaced repetition:", error)
    }
  }

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const handleDragStart = (start: any) => {
    setDraggedNoteId(start.draggableId)
    document.body.style.cursor = "grabbing"
  }

  const handleDragEnd = async (result: DropResult) => {
    setDraggedNoteId(null)
    setDragPreview(null)
    document.body.style.cursor = "default"

    if (!result.destination) return

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    if (sourceIndex === destinationIndex) return

    const reorderedNotes = Array.from(sortedNotes)
    const [removed] = reorderedNotes.splice(sourceIndex, 1)
    reorderedNotes.splice(destinationIndex, 0, removed)

    const updates = reorderedNotes.map((note, index) => ({
      id: note._id,
      position: { x: index % 3, y: Math.floor(index / 3) },
    }))

    try {
      await Promise.all(updates.map((update) => updateNote(update.id, { position: update.position })))
    } catch (error) {
      console.error("Error updating note positions:", error)
    }
  }

  const handleDragUpdate = (update: any) => {
    if (update.destination) {
      const rect = document.querySelector(`[data-rbd-draggable-id="${update.draggableId}"]`)?.getBoundingClientRect()
      if (rect) {
        setDragPreview({ x: rect.left, y: rect.top })
      }
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteNote(id)
      } catch (error) {
        console.error("Error deleting note:", error)
      }
    }
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-muted-foreground mb-4">
          <svg className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium">No notes found</h3>
          <p className="text-sm">Create your first note to get started</p>
        </div>
      </div>
    )
  }

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragUpdate={handleDragUpdate}>
      <Droppable droppableId="notes-grid">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={cn(
              "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-colors",
              snapshot.isDraggingOver && "bg-muted/20 rounded-lg",
            )}
          >
            {sortedNotes.map((note, index) => (
              <Draggable key={note._id} draggableId={note._id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                      "transition-all duration-200",
                      snapshot.isDragging && "rotate-2 scale-105 shadow-2xl z-50",
                      draggedNoteId === note._id && !snapshot.isDragging && "opacity-50",
                    )}
                  >
                    <NoteCard
                      note={note}
                      onEdit={onEditNote}
                      onDelete={handleDeleteNote}
                      onTogglePin={togglePin}
                      onToggleArchive={toggleArchive}
                      onToggleSpacedRepetition={handleToggleSpacedRepetition}
                      isDragging={snapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {draggedNoteId && (
              <div className="border-2 border-dashed border-accent rounded-lg p-4 flex items-center justify-center text-muted-foreground">
                <span className="text-sm">Drop here to reorder</span>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
