"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, RotateCcw, BookOpen } from "lucide-react"

interface QuizQuestion {
  question: string
  type: "multiple-choice" | "true-false" | "short-answer" | "flashcard"
  options?: string[]
  correctAnswer: string
  explanation: string
  difficulty: number
}

interface Quiz {
  _id: string
  title: string
  description?: string
  questions: QuizQuestion[]
  sourceNote?: string
  aiGenerated: boolean
  createdAt: string
}

interface QuizViewerProps {
  quiz: Quiz
  onClose: () => void
}

export function QuizViewer({ quiz, onClose }: QuizViewerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100

  const handleAnswer = (answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }))
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      setQuizCompleted(true)
      setShowResults(true)
    }
  }

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const resetQuiz = () => {
    setCurrentQuestionIndex(0)
    setUserAnswers({})
    setShowResults(false)
    setQuizCompleted(false)
  }

  const calculateScore = () => {
    let correct = 0
    quiz.questions.forEach((question, index) => {
      const userAnswer = userAnswers[index]
      if (userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
        correct++
      }
    })
    return { correct, total: quiz.questions.length, percentage: Math.round((correct / quiz.questions.length) * 100) }
  }

  const renderQuestion = () => {
    const userAnswer = userAnswers[currentQuestionIndex]

    switch (currentQuestion.type) {
      case "multiple-choice":
        return (
          <div className="space-y-4">
            <RadioGroup value={userAnswer || ""} onValueChange={handleAnswer}>
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )

      case "true-false":
        return (
          <div className="space-y-4">
            <RadioGroup value={userAnswer || ""} onValueChange={handleAnswer}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="True" id="true" />
                <Label htmlFor="true" className="cursor-pointer">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="False" id="false" />
                <Label htmlFor="false" className="cursor-pointer">False</Label>
              </div>
            </RadioGroup>
          </div>
        )

      case "short-answer":
        return (
          <div className="space-y-4">
            <Input
              value={userAnswer || ""}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full"
            />
          </div>
        )

      case "flashcard":
        return (
          <div className="space-y-4">
            <Textarea
              value={userAnswer || ""}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Write your answer here..."
              className="w-full min-h-[100px]"
            />
          </div>
        )

      default:
        return null
    }
  }

  const renderResults = () => {
    const score = calculateScore()
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">Quiz Complete!</h3>
          <div className="text-4xl font-bold text-primary mb-2">
            {score.percentage}%
          </div>
          <p className="text-muted-foreground">
            You got {score.correct} out of {score.total} questions correct
          </p>
        </div>

        <div className="space-y-4">
          {quiz.questions.map((question, index) => {
            const userAnswer = userAnswers[index]
            const isCorrect = userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
            
            return (
              <Card key={index} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-2">{question.question}</p>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Your answer:</span> {userAnswer || "No answer"}</p>
                        <p><span className="font-medium">Correct answer:</span> {question.correctAnswer}</p>
                        {question.explanation && (
                          <p className="text-muted-foreground"><span className="font-medium">Explanation:</span> {question.explanation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex gap-2 justify-center">
          <Button onClick={resetQuiz} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake Quiz
          </Button>
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    )
  }

  if (showResults) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {quiz.title} - Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderResults()}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {quiz.title}
          </CardTitle>
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </Badge>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">
              Difficulty: {currentQuestion.difficulty}/5
            </Badge>
            <Badge variant="outline">
              {currentQuestion.type.replace('-', ' ')}
            </Badge>
          </div>
          
          <h3 className="text-lg font-semibold mb-4">
            {currentQuestion.question}
          </h3>
          
          {renderQuestion()}
        </div>

        <div className="flex justify-between">
          <Button 
            onClick={prevQuestion} 
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline">
              Close Quiz
            </Button>
            <Button 
              onClick={nextQuestion}
              disabled={!userAnswers[currentQuestionIndex]}
            >
              {currentQuestionIndex === quiz.questions.length - 1 ? "Finish Quiz" : "Next"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
