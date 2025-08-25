"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Calendar, Search, Sparkles } from "lucide-react"
import { Inter } from "next/font/google"
import {Lekton} from "next/font/google"


export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {   
      router.push("/notes")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to /notes
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6">Lumine</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-powered note-taking with spaced repetition. Transform your learning with intelligent organization and
            smart reminders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => router.push("/auth/register")} className="text-lg px-8">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push("/auth/login")} className="text-lg px-8">
              Sign In
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>AI-Powered</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Generate notes, quizzes, and flashcards with advanced AI assistance</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Spaced Repetition</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Optimize your learning with scientifically-backed review schedules</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Search className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Smart Search</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Find your notes instantly with powerful search and filtering</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Drag & Drop</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Organize your notes effortlessly with intuitive drag-and-drop</CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-serif font-bold mb-6">Ready to transform your learning?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of students and professionals who are already using Lumine to enhance their productivity.
          </p>
          <Button size="lg" onClick={() => router.push("/auth/register")} className="text-lg px-12">
            Start Learning Smarter
          </Button>
        </div>
      </div>
    </div>
  )
}

