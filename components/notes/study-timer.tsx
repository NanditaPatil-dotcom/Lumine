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
      <HoverCardContent className="w-auto p-4">
        <div className="flex items-center justify-center">
          {/* Large live preview only */}
          <div className="relative h-28 w-28">
            <svg viewBox="0 0 36 36" className="h-28 w-28 -rotate-90">
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
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ transform: `scale(${0.6 + progress * 0.8})` }}
            >
              <span className="inline-block h-5 w-5 rounded-full bg-green-400 shadow-[0_0_18px_rgba(34,197,94,0.9)]" />
            </div>
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -ml-[5px] -mt-[5px] rounded-full bg-green-300 shadow"
              style={{ transform: `rotate(${progress * 360}deg) translate(0, -24px)` }}
            />
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

export default StudyTimer


