"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { X, Plus, Save, Eye, Edit3, Sparkles } from "lucide-react"
import { useNotes } from "@/contexts/notes-context"
import { AIProvider, useAI } from "@/contexts/ai-context"
import { useCalendar } from "@/contexts/calendar-context"
import { AISuggestions } from "@/components/ai/ai-suggestions"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"

interface Note {
  _id?: string
  title: string
  content: string
  tags: string[]
  category: string
  isMarkdown: boolean
  spacedRepetition: {
    enabled: boolean
    difficulty: number
    interval: number
    nextReview?: Date
    reviewCount: number
    lastReviewed?: Date
  }
  isPinned: boolean
}

interface NoteEditorProps {
  note?: Note
  onSave: (note: Partial<Note>) => Promise<void>
  onCancel: () => void
}

function NoteEditorContent({ note, onSave, onCancel }: NoteEditorProps) {
  const { categories } = useNotes()
  const { generateQuiz } = useAI()
  const { updateCalendarEvent } = useCalendar()
  const { toast } = useToast()
  const [formData, setFormData] = useState<Partial<Note>>({
    title: "",
    content: "",
    tags: [],
    category: "general",
    isMarkdown: true,
    spacedRepetition: {
      enabled: false,
      difficulty: 3,
      interval: 3,
      reviewCount: 0,
    },
    isPinned: false,
    ...note,
  })
  const [newTag, setNewTag] = useState("")
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("edit")
  const [showAISuggestions, setShowAISuggestions] = useState(false)

  const handleSave = async () => {
    if (!formData.title?.trim() || !formData.content?.trim()) {
      return
    }

    setSaving(true)
    try {
      // Prepare note data with proper spaced repetition initialization
      const noteData = { ...formData }
      
      // If spaced repetition is enabled, set initial review date
      if (noteData.spacedRepetition?.enabled) {
        const nextReview = new Date()
        nextReview.setDate(nextReview.getDate() + (noteData.spacedRepetition.interval || 3))
        
        noteData.spacedRepetition = {
          ...noteData.spacedRepetition,
          nextReview,
          reviewCount: 0,
          lastReviewed: undefined,
        }
        
        console.log("Spaced repetition enabled, setting next review date:", nextReview)
        console.log("Full spaced repetition data:", noteData.spacedRepetition)
      }

      console.log("Saving note with data:", noteData)
      await onSave(noteData)
    } catch (error) {
      console.error("Error saving note:", error)
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim().toLowerCase()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSave()
    }
  }

  const handleAISuggestion = (suggestion: string, type: string) => {
    if (type === "summary") {
      setFormData((prev) => ({
        ...prev,
        content: prev.content + "\n\n## Summary\n" + suggestion,
      }))
    } else if (type === "tags") {
      const newTags = suggestion.split(",").map((tag) => tag.trim().toLowerCase())
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), ...newTags.filter((tag) => !prev.tags?.includes(tag))],
      }))
    }
    setShowAISuggestions(false)
  }

  const handleGenerateQuiz = async () => {
    if (!note?._id) {
      console.error("No note ID available for quiz generation")
      toast({
        title: "Error",
        description: "Cannot generate quiz: Note must be saved first",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("Generating quiz for note:", note._id)
      toast({
        title: "Generating Quiz",
        description: "Please wait while we create your quiz...",
      })
      
      const quiz = await generateQuiz(note._id, 5, formData.spacedRepetition?.difficulty || 3)
      console.log("Quiz generated successfully:", quiz)
      
      toast({
        title: "Success!",
        description: "Quiz generated successfully! You can view it in the Quizzes tab.",
      })
    } catch (error) {
      console.error("Error generating quiz:", error)
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle>{note?._id ? "Edit Note" : "Create New Note"}</CardTitle>
          <div className="flex items-center gap-2">
            {formData.content && formData.content.length > 100 && (
              <Popover open={showAISuggestions} onOpenChange={setShowAISuggestions}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Suggestions
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="left" className="p-0">
                  <AISuggestions
                    content={formData.content}
                    onApplySuggestion={handleAISuggestion}
                    onClose={() => setShowAISuggestions(false)}
                  />
                </PopoverContent>
              </Popover>
            )}
            {note?._id && (
              <Button onClick={handleGenerateQuiz} variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Quiz
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button onClick={onCancel} variant="outline" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-6 overflow-hidden">
        <div className="h-full flex flex-col gap-6">
          {/* Title and Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter note title..."
                onKeyPress={handleKeyPress}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category || "general"}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="study">Study</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === "Enter" && addTag()}
                className="flex-1"
              />
              <Button onClick={addTag} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content Editor */}
          <div className="flex-1 min-h-0">
            <div className="flex items-center justify-between mb-2">
              <Label>Content</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isMarkdown}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isMarkdown: checked }))}
                  />
                  <Label className="text-sm">Markdown</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isPinned}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPinned: checked }))}
                  />
                  <Label className="text-sm">Pin Note</Label>
                </div>
              </div>
            </div>

            {formData.isMarkdown ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="edit" className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="flex-1 mt-2">
                  <Textarea
                    value={formData.content || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your note content here..."
                    className="h-full resize-none font-mono"
                  />
                </TabsContent>
                <TabsContent value="preview" className="flex-1 mt-2">
                  <div className="h-full overflow-auto border rounded-md p-4 bg-muted/50">
                    <ReactMarkdown>
                      {formData.content || "*No content to preview*"}
                    </ReactMarkdown>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <Textarea
                value={formData.content || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Write your note content here..."
                className="h-full resize-none"
              />
            )}
          </div>

          {/* Spaced Repetition Settings */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label className="text-base">Spaced Repetition</Label>
                <p className="text-sm text-muted-foreground">Enable smart review scheduling for this note</p>
              </div>
              <Switch
                checked={formData.spacedRepetition?.enabled}
                onCheckedChange={async (checked) => {
                  setFormData((prev) => ({
                    ...prev,
                    spacedRepetition: { ...prev.spacedRepetition!, enabled: checked },
                  }))
                  
                  if (note?._id) {
                    if (checked) {
                      // If spaced repetition is enabled, set initial review date
                      const nextReview = new Date()
                      nextReview.setDate(nextReview.getDate() + (formData.spacedRepetition?.interval || 3))
                      await updateCalendarEvent(note._id, nextReview)
                    } else {
                      // If spaced repetition is disabled, remove the calendar event
                      await updateCalendarEvent(note._id, undefined)
                    }
                  }
                }}
              />
            </div>

            {formData.spacedRepetition?.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty (1-5)</Label>
                  <Select
                    value={formData.spacedRepetition.difficulty?.toString()}
                    onValueChange={async (value) => {
                      const difficulty = Number.parseInt(value)
                      setFormData((prev) => ({
                        ...prev,
                        spacedRepetition: { ...prev.spacedRepetition!, difficulty },
                      }))
                      
                      // Update calendar event if spaced repetition is enabled
                      if (note?._id && formData.spacedRepetition?.enabled) {
                        const nextReview = new Date()
                        nextReview.setDate(nextReview.getDate() + (formData.spacedRepetition?.interval || 3))
                        await updateCalendarEvent(note._id, nextReview)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Very Easy</SelectItem>
                      <SelectItem value="2">2 - Easy</SelectItem>
                      <SelectItem value="3">3 - Medium</SelectItem>
                      <SelectItem value="4">4 - Hard</SelectItem>
                      <SelectItem value="5">5 - Very Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interval">Initial Interval (days)</Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    max="30"
                    value={formData.spacedRepetition.interval}
                    onChange={async (e) => {
                      const interval = Number.parseInt(e.target.value) || 3
                      setFormData((prev) => ({
                        ...prev,
                        spacedRepetition: { ...prev.spacedRepetition!, interval },
                      }))
                      
                      // Update calendar event if spaced repetition is enabled
                      if (note?._id && formData.spacedRepetition?.enabled) {
                        const nextReview = new Date()
                        nextReview.setDate(nextReview.getDate() + interval)
                        await updateCalendarEvent(note._id, nextReview)
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function NoteEditor(props: NoteEditorProps) {
  return (
    <AIProvider>
      <NoteEditorContent {...props} />
    </AIProvider>
  )
}
