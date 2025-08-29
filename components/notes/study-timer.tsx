"use client"

import { Play, Pause, RotateCcw, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { useTimer } from "@/contexts/timer-context"
import { useState } from "react"

type StudyTimerProps = {
  defaultMinutes?: number
  className?: string
}

export function StudyTimer({ defaultMinutes = 25, className }: StudyTimerProps) {
  const timerContext = useTimer()
  
  // Safety check to ensure context is properly initialized
  if (!timerContext) {
    return (
      <div className={[
        "flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 backdrop-blur px-3 py-2",
        className || "",
      ].join(" ")}>
        <div className="text-sm text-gray-400">Loading timer...</div>
      </div>
    )
  }
  
  const { elapsedMs, isRunning, targetMs, progress: timerProgress, start: startTimer, pause: pauseTimer, reset: resetTimer, setDefaultMinutes } = timerContext

  const [customMinutes, setCustomMinutes] = useState("")

  const minutes = Math.floor(elapsedMs / 60000)
  const seconds = Math.floor((elapsedMs % 60000) / 1000)

  // Plant growth stages based on progress
  const getPlantStage = (timerProgress: number) => {
    if (timerProgress < 0.1) return "seed"
    if (timerProgress < 0.3) return "sprout"
    if (timerProgress < 0.6) return "sapling"
    if (timerProgress < 0.9) return "young-tree"
    return "mature-tree"
  }

  const plantStage = getPlantStage(timerProgress)

  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className={[
          "flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 backdrop-blur px-3 py-2",
          className || "",
        ].join(" ")}>
      {/* Plant growth ring */}
      <div className="relative h-12 w-12">
        <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
          <path
            className="text-white/20"
            stroke="currentColor"
            strokeWidth="3.5"
            fill="none"
            d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32"
          />
          <path
            className={isRunning ? "text-green-400" : "text-green-500/60"}
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${Math.max(1, timerProgress * 100)} 100`}
            d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32"
          />
        </svg>
        {/* Simple plant icon that scales with progress */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `scale(${0.65 + timerProgress * 0.55})` }}
        >
          <span className="inline-block h-3.5 w-3.5 rounded-full bg-green-400 shadow-[0_0_14px_rgba(34,197,94,0.9)]" />
        </div>
        {/* Knob following the progress */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -ml-1 -mt-1 rounded-full bg-green-300 shadow"
          style={{ transform: `rotate(${timerProgress * 360}deg) translate(0, -16px)` }}
        />
        </div>
        {/* Time */}
        <div className="min-w-[68px] text-sm tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
        {/* Controls */}
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Button size="icon" variant="outline" className="h-8 w-8 bg-white/10" onClick={pauseTimer}>
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" className="h-8 w-8" onClick={startTimer}>
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={resetTimer}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-auto p-6">
        <div className="flex flex-col items-center gap-4">
          {/* Growing Plant Animation */}
          <div className="relative h-32 w-32 flex items-center justify-center">
            {/* Soil/ground */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-amber-800 rounded-full opacity-60" />
            
            {/* Plant based on stage */}
            {plantStage === "seed" && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="w-3 h-3 bg-amber-600 rounded-full animate-pulse" />
              </div>
            )}
            
            {plantStage === "sprout" && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="w-1 h-6 bg-green-600 rounded-full" />
                <div className="w-2 h-2 bg-green-500 rounded-full absolute -top-1 left-1/2 transform -translate-x-1/2" />
              </div>
            )}
            
            {plantStage === "sapling" && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="w-1.5 h-12 bg-green-700 rounded-full" />
                <div className="w-4 h-4 bg-green-500 rounded-full absolute -top-2 left-1/2 transform -translate-x-1/2" />
                <div className="w-3 h-3 bg-green-400 rounded-full absolute -top-1 left-1/2 transform -translate-x-1/2" />
              </div>
            )}
            
            {plantStage === "young-tree" && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="w-2 h-16 bg-green-800 rounded-full" />
                <div className="w-8 h-8 bg-green-600 rounded-full absolute -top-4 left-1/2 transform -translate-x-1/2" />
                <div className="w-6 h-6 bg-green-500 rounded-full absolute -top-2 left-1/2 transform -translate-x-1/2" />
                <div className="w-4 h-4 bg-green-400 rounded-full absolute -top-1 left-1/2 transform -translate-x-1/2" />
              </div>
            )}
            
            {plantStage === "mature-tree" && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="w-3 h-20 bg-green-900 rounded-full" />
                <div className="w-12 h-12 bg-green-700 rounded-full absolute -top-6 left-1/2 transform -translate-x-1/2" />
                <div className="w-10 h-10 bg-green-600 rounded-full absolute -top-4 left-1/2 transform -translate-x-1/2" />
                <div className="w-8 h-8 bg-green-500 rounded-full absolute -top-2 left-1/2 transform -translate-x-1/2" />
                <div className="w-6 h-6 bg-green-400 rounded-full absolute -top-1 left-1/2 transform -translate-x-1/2" />
                {/* Add some leaves/berries */}
                <div className="w-2 h-2 bg-green-300 rounded-full absolute -top-8 left-1/2 transform -translate-x-1/2" />
                <div className="w-2 h-2 bg-green-300 rounded-full absolute -top-6 left-1/2 transform -translate-x-1/2 -ml-3" />
                <div className="w-2 h-2 bg-green-300 rounded-full absolute -top-6 left-1/2 transform -translate-x-1/2 ml-3" />
              </div>
            )}
            
            {/* Growth particles when running */}
            {isRunning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-green-400 rounded-full animate-ping" />
                <div className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-green-300 rounded-full animate-pulse" />
              </div>
            )}
          </div>

          {/* Timer Customizer */}
          <div className="flex justify-center mt-4">
            <HoverCard openDelay={200} closeDelay={100}>
              <HoverCardTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-auto p-4" side="top">
                <div className="space-y-3">
                  <div className="text-sm font-medium text-center text-gray-300">
                    Set Timer Duration
                  </div>

                  {/* Preset durations */}
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 25, 30, 45, 60, 90].map((duration) => (
                      <Button
                        key={duration}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          setDefaultMinutes(duration)
                          resetTimer()
                        }}
                      >
                        {duration}m
                      </Button>
                    ))}
                  </div>

                  {/* Custom input */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Custom"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      className="h-8 text-xs w-20"
                      min="1"
                      max="300"
                    />
                    <Button
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        const minutes = parseInt(customMinutes)
                        if (minutes && minutes > 0 && minutes <= 300) {
                          setDefaultMinutes(minutes)
                          resetTimer()
                          setCustomMinutes("")
                        }
                      }}
                      disabled={!customMinutes || parseInt(customMinutes) <= 0}
                    >
                      Set
                    </Button>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </div>

          {/* Progress indicator */}
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">
              {plantStage === "seed" && "🌱 Seed planted"}
              {plantStage === "sprout" && "🌿 Sprout growing"}
              {plantStage === "sapling" && "🌱 Sapling emerging"}
              {plantStage === "young-tree" && "🌳 Young tree"}
              {plantStage === "mature-tree" && "🌲 Mature tree"}
            </div>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300 ease-out"
                style={{ width: `${timerProgress * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(timerProgress * 100)}% complete
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export default StudyTimer


