"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Brain, Calendar, Target, TrendingUp, Clock, Play, BarChart3, Flame } from "lucide-react"
import { useSpacedRepetition } from "@/contexts/spaced-repetition-context"
import { ReviewSession } from "./review-session"
import { formatDistanceToNow } from "date-fns"

export function ReviewDashboard() {
  const { dueNotes, reviewStats, loading, currentReviewSession, startReviewSession } = useSpacedRepetition()

  const [showReviewSession, setShowReviewSession] = useState(false)

  const handleStartReview = async () => {
    await startReviewSession()
    setShowReviewSession(true)
  }

  const handleCompleteSession = () => {
    setShowReviewSession(false)
  }

  if (showReviewSession && currentReviewSession.length > 0) {
    return <ReviewSession onComplete={handleCompleteSession} />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{reviewStats.dueToday}</div>
                <div className="text-sm text-muted-foreground">Due Today</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{reviewStats.streak}</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{Math.round(reviewStats.accuracy)}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{reviewStats.reviewsToday}</div>
                <div className="text-sm text-muted-foreground">Reviewed Today</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Review Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Review Action */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                Spaced Repetition Review
              </CardTitle>
              <CardDescription>
                Review your notes using scientifically-proven spaced repetition techniques
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {dueNotes.length > 0 ? (
                <>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">{dueNotes.length}</div>
                    <div className="text-lg text-muted-foreground">
                      {dueNotes.length === 1 ? "note is" : "notes are"} ready for review
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Daily Progress</span>
                      <span>
                        {reviewStats.reviewsToday} / {reviewStats.reviewsToday + dueNotes.length}
                      </span>
                    </div>
                    <Progress
                      value={(reviewStats.reviewsToday / (reviewStats.reviewsToday + dueNotes.length)) * 100}
                      className="h-2"
                    />
                  </div>

                  <Button onClick={handleStartReview} size="lg" className="w-full">
                    <Play className="h-5 w-5 mr-2" />
                    Start Review Session
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                  <p className="text-muted-foreground">
                    No notes are due for review right now. Great job staying on top of your studies!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Reviews */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dueNotes.length > 0 ? (
                <div className="space-y-3">
                  {dueNotes.slice(0, 5).map((note) => (
                    <div key={note._id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{note.title}</div>
                        <div className="text-xs text-muted-foreground">
                          Due {formatDistanceToNow(new Date(note.spacedRepetition.nextReview), { addSuffix: true })}
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        L{note.spacedRepetition.difficulty}
                      </Badge>
                    </div>
                  ))}
                  {dueNotes.length > 5 && (
                    <div className="text-center text-sm text-muted-foreground">+{dueNotes.length - 5} more notes</div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming reviews</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Study Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Study Statistics</CardTitle>
          <CardDescription>Track your learning progress over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{reviewStats.totalReviews}</div>
              <div className="text-sm text-muted-foreground">Total Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{reviewStats.streak}</div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(reviewStats.accuracy)}%</div>
              <div className="text-sm text-muted-foreground">Overall Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(reviewStats.averageResponseTime / 1000)}s</div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
