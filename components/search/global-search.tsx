"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, Calendar, Brain, Clock, ArrowRight } from "lucide-react"
import { useNotes } from "@/contexts/notes-context"
import { useCalendar } from "@/contexts/calendar-context"
import { useSpacedRepetition } from "@/contexts/spaced-repetition-context"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  title: string
  content: string
  type: "note" | "event" | "review"
  category?: string
  tags?: string[]
  date?: Date
  relevance: number
}

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const { notes } = useNotes()
  const { events } = useCalendar()
  const { reviewNotes } = useSpacedRepetition()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchResults: SearchResult[] = []
    const queryLower = query.toLowerCase()

    // Search notes
    notes.forEach((note) => {
      const titleMatch = note.title.toLowerCase().includes(queryLower)
      const contentMatch = note.content.toLowerCase().includes(queryLower)
      const tagMatch = note.tags.some((tag) => tag.toLowerCase().includes(queryLower))

      if (titleMatch || contentMatch || tagMatch) {
        let relevance = 0
        if (titleMatch) relevance += 3
        if (contentMatch) relevance += 2
        if (tagMatch) relevance += 1

        searchResults.push({
          id: note._id,
          title: note.title,
          content: note.content.substring(0, 100) + "...",
          type: "note",
          category: note.category,
          tags: note.tags,
          relevance,
        })
      }
    })

    // Search events
    events.forEach((event) => {
      const titleMatch = event.title.toLowerCase().includes(queryLower)
      const descriptionMatch = event.description?.toLowerCase().includes(queryLower)

      if (titleMatch || descriptionMatch) {
        let relevance = 0
        if (titleMatch) relevance += 3
        if (descriptionMatch) relevance += 2

        searchResults.push({
          id: event.id,
          title: event.title,
          content: event.description || "No description",
          type: "event",
          date: event.date,
          relevance,
        })
      }
    })

    // Search review notes
    reviewNotes.forEach((note) => {
      const titleMatch = note.title.toLowerCase().includes(queryLower)
      const contentMatch = note.content.toLowerCase().includes(queryLower)

      if (titleMatch || contentMatch) {
        let relevance = 0
        if (titleMatch) relevance += 3
        if (contentMatch) relevance += 2

        searchResults.push({
          id: note.id,
          title: note.title,
          content: note.content.substring(0, 100) + "...",
          type: "review",
          date: note.nextReview,
          relevance,
        })
      }
    })

    // Sort by relevance
    searchResults.sort((a, b) => b.relevance - a.relevance)
    setResults(searchResults.slice(0, 10))
    setSelectedIndex(0)
  }, [query, notes, events, reviewNotes])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev))
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleResultClick(results[selectedIndex])
    } else if (e.key === "Escape") {
      onOpenChange(false)
    }
  }

  const handleResultClick = (result: SearchResult) => {
    // Navigate to the appropriate page/section
    if (result.type === "note") {
      window.location.href = `/notes?highlight=${result.id}`
    } else if (result.type === "event") {
      window.location.href = `/calendar?highlight=${result.id}`
    } else if (result.type === "review") {
      window.location.href = `/review?highlight=${result.id}`
    }
    onOpenChange(false)
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case "note":
        return <FileText className="h-4 w-4" />
      case "event":
        return <Calendar className="h-4 w-4" />
      case "review":
        return <Brain className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getResultTypeColor = (type: string) => {
    switch (type) {
      case "note":
        return "bg-blue-500"
      case "event":
        return "bg-green-500"
      case "review":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Global Search
          </DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search notes, events, and reviews..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10"
            />
          </div>

          {results.length > 0 && (
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    index === selectedIndex ? "bg-accent" : "hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-2 h-2 rounded-full mt-2", getResultTypeColor(result.type))} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getResultIcon(result.type)}
                        <span className="font-medium truncate">{result.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {result.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{result.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {result.tags && result.tags.length > 0 && (
                          <div className="flex gap-1">
                            {result.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {result.date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {result.date.toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {query && results.length === 0 && (
            <div className="mt-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm">Try different keywords or check your spelling</p>
            </div>
          )}

          {!query && (
            <div className="mt-8 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Start typing to search across all your content</p>
              <p className="text-sm">Search notes, events, and review sessions</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
