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
    interval?: number
  }
  isPinned: boolean
  isArchived: boolean
  position: { x: number; y: number }
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

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const handleDeleteNote = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      await deleteNote(id)
    }
  }

  const handleDragStart = (start: any) => {
    setDraggedNoteId(start.draggableId)
    document.body.style.cursor = "grabbing"
  }

  const handleDragEnd = async (result: DropResult) => {
    setDraggedNoteId(null)
    document.body.style.cursor = "default"
    if (!result.destination) return
    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index
    if (sourceIndex === destinationIndex) return

    const reordered = Array.from(sortedNotes)
    const [removed] = reordered.splice(sourceIndex, 1)
    reordered.splice(destinationIndex, 0, removed)

    const updates = reordered.map((note, index) => ({
      id: note._id,
      position: { x: index % 4, y: Math.floor(index / 4) },
    }))

    await Promise.all(updates.map((u) => updateNote(u.id, { position: u.position })))
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-muted-foreground">
          <svg className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium">No notes found</h3>
          <p className="text-sm">Create your first note to get started</p>
        </div>
      </div>
    )
  }

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Droppable droppableId="notes-grid">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={cn(
              // denser 2–4 column grid to match the screenshot
              "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
              "transition-colors",
              snapshot.isDraggingOver && "bg-white/5 rounded-lg"
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
                      draggedNoteId === note._id && !snapshot.isDragging && "opacity-50"
                    )}
                  >
                    <NoteCard
                      note={note}
                      onEdit={onEditNote}
                      onDelete={handleDeleteNote}
                      onTogglePin={togglePin}
                      onToggleArchive={toggleArchive}
                      onToggleSpacedRepetition={(id, enabled) =>
                        updateNote(id, {
                          spacedRepetition: {
                            ...note.spacedRepetition,
                            enabled,
                          },
                        })
                      }
                      isDragging={snapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}
