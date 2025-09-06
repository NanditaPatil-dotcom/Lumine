"use client"

import { useState } from "react"
import { StudyTimer } from "@/components/notes/study-timer"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sparkles } from "lucide-react"
import { AIAssistant } from "@/components/ai/ai-assistant"

export function TopNavbar() {
  const [aiOpen, setAiOpen] = useState(false)

  return (
    <div className="fixed top-0 right-4 z-50 p-4 flex items-center gap-3">
      <Popover open={aiOpen} onOpenChange={setAiOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          side="bottom" 
          align="end" 
          className="w-[600px] h-[500px] p-0 overflow-hidden"
        >
          <div className="h-full overflow-auto">
            <AIAssistant />
          </div>
        </PopoverContent>
      </Popover>
      
      <StudyTimer defaultMinutes={25} />
    </div>
  )
}
