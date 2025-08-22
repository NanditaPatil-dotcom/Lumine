"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Pin, Archive, Edit, Trash2, MoreVertical, Calendar, Brain } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import ReactMarkdown from "react-markdown"
import { useNotes } from "@/contexts/notes-context"
import { useCalendar } from "@/contexts/calendar-context"

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
  createdAt: string
  updatedAt: string
}

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
  onTogglePin: (id: string) => void
  onToggleArchive: (id: string) => void
  onToggleSpacedRepetition: (id: string, enabled: boolean) => void
  isDragging?: boolean
}

export function NoteCard({ 
  note, 
  onEdit, 
  onDelete, 
  onTogglePin, 
  onToggleArchive, 
  onToggleSpacedRepetition,
  isDragging 
}: NoteCardProps) {
  const [showFullContent, setShowFullContent] = useState(false)
  const { updateNote } = useNotes()
  const { createSpacedRepetitionEvent, removeSpacedRepetitionEvents } = useCalendar()

  const truncatedContent = note.content.length > 150 ? note.content.substring(0, 150) + "..." : note.content

  const handleSpacedRepetitionToggle = async (enabled: boolean) => {
    try {
      // Update the note's spaced repetition status
      await onToggleSpacedRepetition(note._id, enabled)
      
      if (enabled) {
        // If enabling spaced repetition, add to calendar
        const nextReview = new Date()
        nextReview.setDate(nextReview.getDate() + (note.spacedRepetition?.interval || 3))
        
        // Create calendar event for the review
        await createSpacedRepetitionEvent(
          note._id,
          note.title,
          nextReview,
          note.spacedRepetition?.interval || 3
        )
      } else {
        // If disabling spaced repetition, remove from calendar
        await removeSpacedRepetitionEvents(note._id)
      }
    } catch (error) {
      console.error("Error toggling spaced repetition:", error)
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case 2:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case 3:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case 4:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case 5:
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  return (
    <Card
      className={`
        cursor-pointer hover:shadow-md transition-all duration-200 group
        ${isDragging ? "opacity-50 rotate-2 scale-105" : ""}
        ${note.isPinned ? "ring-2 ring-accent/50" : ""}
      `}
      onClick={() => onEdit(note)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg flex items-center gap-2">
              {note.isPinned && <Pin className="h-4 w-4 text-accent" />}
              <span className="truncate">{note.title}</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span className="capitalize">{note.category}</span>
              {note.spacedRepetition.enabled && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-xs ${getDifficultyColor(note.spacedRepetition.difficulty)}`}
                    >
                      Level {note.spacedRepetition.difficulty}
                    </span>
                  </div>
                </>
              )}
            </CardDescription>
          </div>
          
          {/* Spaced Repetition Toggle */}
          <div className="flex items-center gap-2 mr-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
              note.spacedRepetition.enabled 
                ? 'bg-primary/10 dark:bg-primary/20 border-primary/30 text-primary' 
                : 'bg-muted/80 dark:bg-muted/60 border-border/50 text-muted-foreground'
            }`}>
              <Brain className={`h-4 w-4 ${
                note.spacedRepetition.enabled ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <Switch
                checked={note.spacedRepetition.enabled}
                onCheckedChange={handleSpacedRepetitionToggle}
                onClick={(e) => e.stopPropagation()}
                className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/60 data-[state=checked]:ring-2 data-[state=checked]:ring-primary/20"
              />
              {note.spacedRepetition.enabled && (
                <span className="text-xs font-medium">Active</span>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(note)
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onTogglePin(note._id)
                }}
              >
                <Pin className="h-4 w-4 mr-2" />
                {note.isPinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleArchive(note._id)
                }}
              >
                <Archive className="h-4 w-4 mr-2" />
                {note.isArchived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(note._id)
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Content Preview */}
          <div className="text-sm text-muted-foreground">
            {note.isMarkdown ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{showFullContent ? note.content : truncatedContent}</ReactMarkdown>
              </div>
            ) : (
              <p>{showFullContent ? note.content : truncatedContent}</p>
            )}
            {note.content.length > 150 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowFullContent(!showFullContent)
                }}
                className="text-primary hover:underline mt-1"
              >
                {showFullContent ? "Show less" : "Show more"}
              </button>
            )}
          </div>

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {note.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{note.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>
            {note.spacedRepetition.enabled && note.spacedRepetition.nextReview && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  Review {formatDistanceToNow(new Date(note.spacedRepetition.nextReview), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
