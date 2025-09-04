"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Sparkles, FileText, Brain, Lightbulb, Tags, BookOpen } from "lucide-react"
import { useAI } from "@/contexts/ai-context"
import { useNotes } from "@/contexts/notes-context"

export function AIAssistant() {
  const { loading, generateNote, generateQuiz, generateSummary, generateTags } = useAI()
  const { notes, refreshNotes } = useNotes()
  const [activeTab, setActiveTab] = useState("generate")

  // Generate Note State
  const [notePrompt, setNotePrompt] = useState("")
  const [noteCategory, setNoteCategory] = useState("general")

  // Generate Quiz State
  const [selectedNoteId, setSelectedNoteId] = useState("")
  const [quizQuestionCount, setQuizQuestionCount] = useState(5)
  const [quizDifficulty, setQuizDifficulty] = useState(3)
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null)

  // Enhance Content State
  const [contentToEnhance, setContentToEnhance] = useState("")
  const [enhancementType, setEnhancementType] = useState("summary")
  const [enhancedResult, setEnhancedResult] = useState("")

  const handleGenerateNote = async () => {
    if (!notePrompt.trim()) return

    try {
      const note = await generateNote(notePrompt, noteCategory)
      setNotePrompt("")
      await refreshNotes()
      // Note is already saved by the AI endpoint
    } catch (error) {
      console.error("Error generating note:", error)
    }
  }

  const handleGenerateQuiz = async () => {
    if (!selectedNoteId) return

    try {
      const quiz = await generateQuiz(selectedNoteId, quizQuestionCount, quizDifficulty)
      setGeneratedQuiz(quiz)
    } catch (error) {
      console.error("Error generating quiz:", error)
    }
  }

  const handleEnhanceContent = async () => {
    if (!contentToEnhance.trim()) return

    try {
      let result = ""
      if (enhancementType === "summary") {
        result = await generateSummary(contentToEnhance)
      } else if (enhancementType === "tags") {
        const tags = await generateTags(contentToEnhance)
        result = tags.join(", ")
      }
      setEnhancedResult(result)
    } catch (error) {
      console.error("Error enhancing content:", error)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-serif font-bold">AI Assistant</h1>
          </div>
          <p className="text-muted-foreground">Generate notes, create quizzes, and enhance your content with AI</p>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generate Notes
            </TabsTrigger>
            <TabsTrigger value="quiz" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Create Quiz
            </TabsTrigger>
            <TabsTrigger value="enhance" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Enhance Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generate Note from Prompt
                </CardTitle>
                <CardDescription>
                  Describe what you want to learn about, and AI will create a comprehensive note for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">What would you like to learn about?</Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g., Explain React hooks and their use cases with examples"
                    value={notePrompt}
                    onChange={(e) => setNotePrompt(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={noteCategory} onValueChange={setNoteCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="study">Study</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleGenerateNote} disabled={loading || !notePrompt.trim()} className="w-full">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Note
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quiz" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Generate Quiz from Note
                  </CardTitle>
                  <CardDescription>Select a note and AI will create a quiz to test your knowledge</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="note-select">Select Note</Label>
                    <Select value={selectedNoteId} onValueChange={setSelectedNoteId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a note to create quiz from" />
                      </SelectTrigger>
                      <SelectContent>
                        {notes.map((note) => (
                          <SelectItem key={note._id} value={note._id}>
                            {note.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="question-count">Number of Questions</Label>
                      <Select
                        value={quizQuestionCount.toString()}
                        onValueChange={(value) => setQuizQuestionCount(Number.parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 Questions</SelectItem>
                          <SelectItem value="5">5 Questions</SelectItem>
                          <SelectItem value="10">10 Questions</SelectItem>
                          <SelectItem value="15">15 Questions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty Level</Label>
                      <Select
                        value={quizDifficulty.toString()}
                        onValueChange={(value) => setQuizDifficulty(Number.parseInt(value))}
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
                  </div>

                  <Button onClick={handleGenerateQuiz} disabled={loading || !selectedNoteId} className="w-full">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Quiz...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Generate Quiz
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {generatedQuiz && (
                <Card>
                  <CardHeader>
                    <CardTitle>{generatedQuiz.title}</CardTitle>
                    <CardDescription>{generatedQuiz.questions.length} questions • AI Generated</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {generatedQuiz.questions.slice(0, 2).map((question: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{question.type}</Badge>
                            <Badge variant="secondary">Level {question.difficulty}</Badge>
                          </div>
                          <h4 className="font-medium mb-2">{question.question}</h4>
                          {question.options && (
                            <div className="space-y-1">
                              {question.options.map((option: string, optIndex: number) => (
                                <div key={optIndex} className="text-sm text-muted-foreground">
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {generatedQuiz.questions.length > 2 && (
                        <p className="text-sm text-muted-foreground text-center">
                          ... and {generatedQuiz.questions.length - 2} more questions
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="enhance" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Enhance Your Content
                  </CardTitle>
                  <CardDescription>Get AI-powered summaries, tags, and improvements for your content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="content">Content to Enhance</Label>
                    <Textarea
                      id="content"
                      placeholder="Paste your content here..."
                      value={contentToEnhance}
                      onChange={(e) => setContentToEnhance(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="enhancement-type">Enhancement Type</Label>
                    <Select value={enhancementType} onValueChange={setEnhancementType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summary">Generate Summary</SelectItem>
                        <SelectItem value="tags">Suggest Tags</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleEnhanceContent}
                    disabled={loading || !contentToEnhance.trim()}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Enhance Content
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {enhancedResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {enhancementType === "summary" ? <BookOpen className="h-5 w-5" /> : <Tags className="h-5 w-5" />}
                      {enhancementType === "summary" ? "Generated Summary" : "Suggested Tags"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm">{enhancedResult}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
