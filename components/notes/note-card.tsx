"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Pin, Archive, Edit, Trash2, MoreVertical, Calendar, Brain, BookOpen } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import ReactMarkdown from "react-markdown"
import { useCalendar } from "@/contexts/calendar-context"
import { useAI } from "@/contexts/ai-context"
import { useToast } from "@/hooks/use-toast"

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
    reviewCount: number
    lastReviewed?: Date
    interval: number
  }
  isPinned: boolean
  isArchived: boolean
  position: { x: number; y: number }
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
  onGenerateQuiz?: (noteId: string) => void
  isDragging?: boolean
}

export function NoteCard({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleArchive,
  onToggleSpacedRepetition,
  onGenerateQuiz,
  isDragging,
}: NoteCardProps) {
  const [showFullContent, setShowFullContent] = useState(false)
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
  const { createSpacedRepetitionEvent, removeSpacedRepetitionEvents } = useCalendar()
  const { generateQuiz } = useAI()
  const { toast } = useToast()

  const truncatedContent =
    note.content.length > 140 ? note.content.slice(0, 140) + "…" : note.content

  const handleSpacedRepetitionToggle = async (enabled: boolean) => {
    try {
      await onToggleSpacedRepetition(note._id, enabled)

      if (enabled) {
        const interval = note.spacedRepetition?.interval ?? 3
        const nextReview = new Date()
        nextReview.setDate(nextReview.getDate() + interval)
        await createSpacedRepetitionEvent(note._id, note.title, nextReview, interval)
      } else {
        await removeSpacedRepetitionEvents(note._id)
      }
    } catch (err) {
      console.error("SR toggle failed:", err)
    }
  }

  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true)
    try {
      const quiz = await generateQuiz(note._id, 5, note.spacedRepetition?.difficulty || 3)
      toast({
        title: "Quiz Generated!",
        description: `Created "${quiz.title}" with ${quiz.questions.length} questions.`,
      })
      if (onGenerateQuiz) {
        onGenerateQuiz(note._id)
      }
    } catch (error) {
      console.error("Error generating quiz:", error)
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingQuiz(false)
    }
  }

  return (
    <Card
      className={[
        "group relative flex flex-col justify-between",
        "rounded-2xl border border-white/10 bg-white/5",
        "backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-200",
        "cursor-pointer",
        isDragging ? "opacity-60 rotate-2 scale-[1.02]" : "",
        note.isPinned ? "ring-2 ring-accent/50" : "",
        // fixed height for neat tiles like your screenshot
        "h-[230px]",
      ].join(" ")}
      onClick={() => onEdit(note)}
    >
      {/* Header */}
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              {note.isPinned && <Pin className="h-4 w-4 text-accent shrink-0" />}
              <span className="truncate">{note.title || "Untitled note"}</span>
            </CardTitle>
            <div className="mt-1 text-xs text-muted-foreground capitalize">
              {note.category || "uncategorized"}
            </div>
          </div>

          {/* Actions (show on hover) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(note) }}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePin(note._id) }}>
                <Pin className="h-4 w-4 mr-2" /> {note.isPinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleArchive(note._id) }}>
                <Archive className="h-4 w-4 mr-2" /> {note.isArchived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); handleGenerateQuiz() }}
                disabled={isGeneratingQuiz}
              >
                <BookOpen className="h-4 w-4 mr-2" /> 
                {isGeneratingQuiz ? "Generating..." : "Generate Quiz"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(note._id) }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Body */}
      <CardContent className="px-4 pb-3 flex flex-col gap-3">
        {/* Content preview */}
        <div className="text-sm text-muted-foreground">
          {note.isMarkdown ? (
            <div className="prose prose-sm max-w-none dark:prose-invert line-clamp-3">
              <ReactMarkdown>{showFullContent ? note.content : truncatedContent}</ReactMarkdown>
            </div>
          ) : (
            <p className="line-clamp-3">
              {showFullContent ? note.content : truncatedContent}
            </p>
          )}
          {note.content.length > 140 && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowFullContent(!showFullContent) }}
              className="mt-1 text-xs text-primary hover:underline"
            >
              {showFullContent ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {/* Tags */}
        {note.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px]">
                {tag}
              </Badge>
            ))}
            {note.tags.length > 3 && (
              <Badge variant="outline" className="text-[10px]">
                +{note.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t pt-2 text-[11px] text-muted-foreground">
          <span>{formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}</span>

          <div
            className="flex items-center gap-2 rounded-full px-3 py-2 border border-white/20 bg-gray-600/30"
            onClick={(e) => e.stopPropagation()}
          >
            <Brain
              className={`h-3 w-3 ${
                note.spacedRepetition.enabled ? "text-primary" : "text-muted-foreground"
              }`}
            />
            <Switch
              checked={note.spacedRepetition.enabled}
              onCheckedChange={handleSpacedRepetitionToggle}
              className="scale-90 data-[state=checked]:bg-green-400 data-[state=unchecked]:bg-gray-400"
            />
            {note.spacedRepetition.enabled && note.spacedRepetition.nextReview && (
              <div className="hidden md:flex items-center gap-1 pl-1 ml-1 border-l border-white/10">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(note.spacedRepetition.nextReview), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
