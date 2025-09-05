"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, Search, Calendar, Brain, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { QuizViewer } from "./quiz-viewer"

interface Quiz {
  _id: string
  title: string
  description?: string
  questions: {
    question: string
    type: "multiple-choice" | "true-false" | "short-answer" | "flashcard"
    options?: string[]
    correctAnswer: string
    explanation: string
    difficulty: number
  }[]
  sourceNote?: string
  aiGenerated: boolean
  createdAt: string
}

interface QuizListProps {
  onClose?: () => void
}

export function QuizList({ onClose }: QuizListProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const { user } = useAuth()

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  }

  const fetchQuizzes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/quiz`, {
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        const data = await response.json()
        setQuizzes(data.quizzes || [])
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error)
    } finally {
      setLoading(false)
    }
  }

  const deleteQuiz = async (quizId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/${quizId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      })

      if (response.ok) {
        setQuizzes(prev => prev.filter(quiz => quiz._id !== quizId))
      }
    } catch (error) {
      console.error("Error deleting quiz:", error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchQuizzes()
    }
  }, [user])

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quiz.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (selectedQuiz) {
    return (
      <QuizViewer 
        quiz={selectedQuiz} 
        onClose={() => setSelectedQuiz(null)} 
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          My Quizzes
        </h2>
        {onClose && (
          <Button onClick={onClose} variant="outline">
            Back to Notes
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading quizzes...</p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No quizzes found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try adjusting your search terms" : "Generate your first quiz from a note!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz._id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-2">
                    {quiz.title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteQuiz(quiz._id)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {quiz.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {quiz.description}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {quiz.questions.length} questions
                  </Badge>
                  {quiz.aiGenerated && (
                    <Badge variant="outline" className="text-xs">
                      <Brain className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDistanceToNow(new Date(quiz.createdAt), { addSuffix: true })}
                  </div>
                </div>

                <Button 
                  onClick={() => setSelectedQuiz(quiz)}
                  className="w-full"
                  size="sm"
                >
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
