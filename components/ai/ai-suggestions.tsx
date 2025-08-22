"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Lightbulb, Tags, BookOpen, X } from "lucide-react"
import { useAI } from "@/contexts/ai-context"

interface AISuggestionsProps {
  content: string
  onApplySuggestion: (suggestion: string, type: string) => void
  onClose?: () => void
}

export function AISuggestions({ content, onApplySuggestion, onClose }: AISuggestionsProps) {
  const { loading, generateSummary, generateTags } = useAI()
  const [suggestions, setSuggestions] = useState<{
    summary?: string
    tags?: string[]
  }>({})

  useEffect(() => {
    if (content.length > 100) {
      generateSuggestions()
    }
  }, [content])

  const generateSuggestions = async () => {
    try {
      const [summary, tags] = await Promise.all([generateSummary(content), generateTags(content)])
      setSuggestions({ summary, tags })
    } catch (error) {
      console.error("Error generating suggestions:", error)
    }
  }

  if (loading) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 animate-pulse" />
            AI Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!suggestions.summary && !suggestions.tags?.length) {
    return null
  }

  return (
    <Card className="w-80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Suggestions
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>AI-powered suggestions for your content</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.summary && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">Summary</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">{suggestions.summary}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApplySuggestion(suggestions.summary!, "summary")}
              className="w-full"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Add Summary
            </Button>
          </div>
        )}

        {suggestions.tags && suggestions.tags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tags className="h-4 w-4" />
              <span className="text-sm font-medium">Suggested Tags</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {suggestions.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApplySuggestion(suggestions.tags!.join(","), "tags")}
              className="w-full"
            >
              <Tags className="h-4 w-4 mr-2" />
              Apply Tags
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
