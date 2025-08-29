"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Play, Pause, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

type StudyTimerProps = {
  defaultMinutes?: number
  className?: string
}

type SessionRecord = {
  id: string
  startedAt: number
  endedAt: number
  durationMs: number
}

export function StudyTimer({ defaultMinutes = 25, className }: StudyTimerProps) {
  const targetMs = defaultMinutes * 60 * 1000
  const [elapsedMs, setElapsedMs] = useState<number>(0)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const startedAtRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  // Derived progress 0..1
  const progress = useMemo(() => {
    const clamped = Math.max(0, Math.min(1, elapsedMs / targetMs))
    return clamped
  }, [elapsedMs, targetMs])

  useEffect(() => {
    if (!isRunning) return

    if (startedAtRef.current == null) startedAtRef.current = Date.now()
    let last = performance.now()

    const tick = (now: number) => {
      const delta = now - last
      last = now
      setElapsedMs((prev) => {
        const next = prev + delta
        if (next >= targetMs) {
          completeSession(next)
          return targetMs
        }
        return next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isRunning, targetMs])

  const start = () => {
    if (elapsedMs >= targetMs) setElapsedMs(0)
    setIsRunning(true)
  }

  const pause = () => {
    setIsRunning(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }

  const reset = () => {
    pause()
    startedAtRef.current = null
    setElapsedMs(0)
  }

  const completeSession = (finalElapsed: number) => {
    pause()
    const endedAt = Date.now()
    const startedAt = startedAtRef.current ?? endedAt - finalElapsed
    const record: SessionRecord = {
      id: `${endedAt}`,
      startedAt,
      endedAt,
      durationMs: Math.min(finalElapsed, targetMs),
    }
    try {
      const key = "studySessions"
      const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null
      const list: SessionRecord[] = raw ? JSON.parse(raw) : []
      list.unshift(record)
      if (list.length > 100) list.pop()
      localStorage.setItem(key, JSON.stringify(list))
    } catch {
      // ignore storage errors
    }
    startedAtRef.current = null
  }

  const minutes = Math.floor(elapsedMs / 60000)
  const seconds = Math.floor((elapsedMs % 60000) / 1000)

  // Plant growth stages based on progress
  const getPlantStage = (progress: number) => {
    if (progress < 0.1) return "seed"
    if (progress < 0.3) return "sprout"
    if (progress < 0.6) return "sapling"
    if (progress < 0.9) return "young-tree"
    return "mature-tree"
  }

  const plantStage = getPlantStage(progress)

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
            strokeDasharray={`${Math.max(1, progress * 100)} 100`}
            d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32"
          />
        </svg>
        {/* Simple plant icon that scales with progress */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `scale(${0.65 + progress * 0.55})` }}
        >
          <span className="inline-block h-3.5 w-3.5 rounded-full bg-green-400 shadow-[0_0_14px_rgba(34,197,94,0.9)]" />
        </div>
        {/* Knob following the progress */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -ml-1 -mt-1 rounded-full bg-green-300 shadow"
          style={{ transform: `rotate(${progress * 360}deg) translate(0, -16px)` }}
        />
        </div>
        {/* Time */}
        <div className="min-w-[68px] text-sm tabular-nums">
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
        {/* Controls */}
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Button size="icon" variant="outline" className="h-8 w-8 bg-white/10" onClick={pause}>
              <Pause className="h-4 w-4" />
            </Button>
          ) : (
            <Button size="icon" className="h-8 w-8" onClick={start}>
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={reset}>
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
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(progress * 100)}% complete
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export default StudyTimer


