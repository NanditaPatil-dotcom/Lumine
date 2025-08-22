"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Eye, EyeOff, CheckCircle, XCircle, Clock, Brain, Trophy, Target } from "lucide-react"
import { useSpacedRepetition } from "@/contexts/spaced-repetition-context"
import ReactMarkdown from "react-markdown"

interface ReviewSessionProps {
  onComplete: () => void
}

export function ReviewSession({ onComplete }: ReviewSessionProps) {
  const { currentReviewSession, sessionProgress, submitReview, skipNote, endSession } = useSpacedRepetition()

  const [currentNoteIndex, setCurrentNoteIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [startTime, setStartTime] = useState<Date>(new Date())
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
    skipped: 0,
  })

  const currentNote = currentReviewSession[currentNoteIndex]
  const isLastNote = currentNoteIndex >= currentReviewSession.length - 1
  const progressPercentage = ((currentNoteIndex + (showAnswer ? 0.5 : 0)) / currentReviewSession.length) * 100

  useEffect(() => {
    setStartTime(new Date())
    setShowAnswer(false)
  }, [currentNoteIndex])

  const handleShowAnswer = () => {
    setShowAnswer(true)
  }

  const handleQualityRating = async (quality: number) => {
    if (!currentNote) return

    const responseTime = new Date().getTime() - startTime.getTime()
    await submitReview(currentNote._id, quality, responseTime)

    // Update session stats
    setSessionStats((prev) => ({
      ...prev,
      correct: quality >= 3 ? prev.correct + 1 : prev.correct,
      incorrect: quality < 3 ? prev.incorrect + 1 : prev.incorrect,
    }))

    moveToNextNote()
  }

  const handleSkip = async () => {
    if (!currentNote) return

    await skipNote(currentNote._id)
    setSessionStats((prev) => ({ ...prev, skipped: prev.skipped + 1 }))
    moveToNextNote()
  }

  const moveToNextNote = () => {
    if (isLastNote) {
      endSession()
      onComplete()
    } else {
      setCurrentNoteIndex((prev) => prev + 1)
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

  if (!currentNote) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="text-center py-12">
          <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Session Complete!</h2>
          <p className="text-muted-foreground mb-6">Great job on completing your review session.</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{sessionStats.correct}</div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{sessionStats.incorrect}</div>
              <div className="text-sm text-muted-foreground">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{sessionStats.skipped}</div>
              <div className="text-sm text-muted-foreground">Skipped</div>
            </div>
          </div>

          <Button onClick={onComplete}>Continue</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <span className="font-medium">Review Session</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {currentNoteIndex + 1} of {currentReviewSession.length}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {Math.floor((new Date().getTime() - startTime.getTime()) / 1000)}s
              </div>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Review Card */}
      <Card className="min-h-[400px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl">{currentNote.title}</CardTitle>
              <Badge variant="outline" className={getDifficultyColor(currentNote.spacedRepetition.difficulty)}>
                Level {currentNote.spacedRepetition.difficulty}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{currentNote.category}</Badge>
              {currentNote.tags.slice(0, 2).map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <CardDescription>Review this note and test your knowledge</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Note Content */}
          <div className="bg-muted/50 rounded-lg p-6">
            {currentNote.isMarkdown ? (
              <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                {currentNote.content}
              </ReactMarkdown>
            ) : (
              <p className="whitespace-pre-wrap">{currentNote.content}</p>
            )}
          </div>

          {/* Action Buttons */}
          {!showAnswer ? (
            <div className="flex justify-center">
              <Button onClick={handleShowAnswer} size="lg">
                <Eye className="h-4 w-4 mr-2" />
                Show Answer / Test Knowledge
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-lg font-medium mb-4">How well did you remember this?</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleQualityRating(0)}
                    className="flex flex-col gap-1 h-auto py-3"
                  >
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-xs">Complete Blackout</span>
                    <span className="text-xs text-muted-foreground">0</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleQualityRating(1)}
                    className="flex flex-col gap-1 h-auto py-3"
                  >
                    <XCircle className="h-5 w-5 text-red-400" />
                    <span className="text-xs">Incorrect</span>
                    <span className="text-xs text-muted-foreground">1</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleQualityRating(2)}
                    className="flex flex-col gap-1 h-auto py-3"
                  >
                    <RotateCcw className="h-5 w-5 text-yellow-500" />
                    <span className="text-xs">Incorrect but Easy</span>
                    <span className="text-xs text-muted-foreground">2</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleQualityRating(3)}
                    className="flex flex-col gap-1 h-auto py-3"
                  >
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span className="text-xs">Correct with Effort</span>
                    <span className="text-xs text-muted-foreground">3</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleQualityRating(4)}
                    className="flex flex-col gap-1 h-auto py-3"
                  >
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-xs">Easy</span>
                    <span className="text-xs text-muted-foreground">4</span>
                  </Button>
                </div>
              </div>

              <div className="flex justify-center">
                <Button variant="ghost" onClick={handleSkip}>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Skip This Note
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Stats */}
      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">{sessionStats.correct}</div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">{sessionStats.incorrect}</div>
              <div className="text-sm text-muted-foreground">Incorrect</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">{sessionStats.skipped}</div>
              <div className="text-sm text-muted-foreground">Skipped</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
