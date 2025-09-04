"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

type SessionRecord = {
  id: string
  startedAt: number
  endedAt: number
  durationMs: number
}

type TimerContextType = {
  elapsedMs: number
  isRunning: boolean
  targetMs: number
  progress: number
  start: () => void
  pause: () => void
  reset: () => void
  setDefaultMinutes: (minutes: number) => void
}

const TimerContext = createContext<TimerContextType | null>(null)

export function useTimer() {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error("useTimer must be used within a TimerProvider")
  }
  return context
}

interface TimerProviderProps {
  children: React.ReactNode
  defaultMinutes?: number
}

export function TimerProvider({
  children,
  defaultMinutes = 25,
}: TimerProviderProps) {
  // --- Core state ---
  const [isClient, setIsClient] = useState(false)
  const [defaultMinutesState, setDefaultMinutesState] = useState(defaultMinutes)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  // --- Refs ---
  const startedAtRef = useRef<number | null>(null)
  const targetMsRef = useRef<number>(0)

  // --- Derived values ---
  const targetMs = useMemo(
    () => defaultMinutesState * 60 * 1000,
    [defaultMinutesState]
  )
  const progress = useMemo(() => {
    return Math.max(0, Math.min(1, elapsedMs / targetMs))
  }, [elapsedMs, targetMs])

  // --- Client detection (SSR safe) ---
  useEffect(() => {
    setIsClient(true)
  }, [])

  // --- Initialize from localStorage ---
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const saved = localStorage.getItem("studyTimer:elapsedMs")
      const wasRunning =
        localStorage.getItem("studyTimer:isRunning") === "true"
      const startTime = localStorage.getItem("studyTimer:startTime")

      if (wasRunning && startTime) {
        const now = Date.now()
        const start = parseInt(startTime, 10)
        const elapsed = now - start
        const currentTargetMs = defaultMinutes * 60 * 1000

        if (elapsed < currentTargetMs) {
          startedAtRef.current = start
        }

        setElapsedMs(Math.min(elapsed, currentTargetMs))
      } else {
        setElapsedMs(saved ? parseInt(saved, 10) : 0)
      }

      setIsRunning(wasRunning)
    } catch (error) {
      console.warn("Error loading timer state:", error)
    }
  }, [defaultMinutes])

  // --- Keep target in sync ---
  useEffect(() => {
    targetMsRef.current = targetMs
  }, [targetMs])

  // --- Save elapsed time ---
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem("studyTimer:elapsedMs", elapsedMs.toString())
    } catch (error) {
      console.warn("Error saving timer state:", error)
    }
  }, [elapsedMs])

  // --- Timer ticking effect ---
  useEffect(() => {
    if (!isRunning) return

    if (startedAtRef.current == null) {
      const savedStartTime = localStorage.getItem("studyTimer:startTime")
      startedAtRef.current = savedStartTime
        ? parseInt(savedStartTime, 10)
        : Date.now()
    }

    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - (startedAtRef.current ?? now)

      if (elapsed >= targetMsRef.current) {
        // Stop timer
        setIsRunning(false)
        const endedAt = Date.now()
        const startedAt = startedAtRef.current ?? endedAt - elapsed
        const record: SessionRecord = {
          id: `${endedAt}`,
          startedAt,
          endedAt,
          durationMs: Math.min(elapsed, targetMsRef.current),
        }

        try {
          const key = "studySessions"
          const raw = localStorage.getItem(key)
          const list: SessionRecord[] = raw ? JSON.parse(raw) : []
          list.unshift(record)
          if (list.length > 100) list.pop()
          localStorage.setItem(key, JSON.stringify(list))
        } catch {
          /* ignore storage errors */
        }

        startedAtRef.current = null
        localStorage.setItem("studyTimer:isRunning", "false")
      } else {
        setElapsedMs(elapsed)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isRunning])

  // --- Visibility change (tab switch) ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isRunning && startedAtRef.current) {
        const now = Date.now()
        const elapsed = now - startedAtRef.current
        if (elapsed < targetMs) {
          setElapsedMs(elapsed)
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [isRunning, targetMs])

  // --- Control functions ---
  const start = () => {
    try {
      if (elapsedMs >= targetMs) setElapsedMs(0)
      const startTime = Date.now()
      startedAtRef.current = startTime
      setIsRunning(true)
      localStorage.setItem("studyTimer:isRunning", "true")
      localStorage.setItem("studyTimer:startTime", startTime.toString())
    } catch (error) {
      console.warn("Error starting timer:", error)
    }
  }

  const pause = () => {
    try {
      setIsRunning(false)
      localStorage.setItem("studyTimer:isRunning", "false")
    } catch (error) {
      console.warn("Error pausing timer:", error)
    }
  }

  const reset = () => {
    try {
      pause()
      startedAtRef.current = null
      setElapsedMs(0)
      localStorage.setItem("studyTimer:elapsedMs", "0")
      localStorage.removeItem("studyTimer:startTime")
    } catch (error) {
      console.warn("Error resetting timer:", error)
    }
  }

  const setDefaultMinutes = (minutes: number) => {
    setDefaultMinutesState(minutes)
  }

  const value: TimerContextType = {
    elapsedMs,
    isRunning,
    targetMs,
    progress,
    start,
    pause,
    reset,
    setDefaultMinutes,
  }

  // --- Render ---
  if (!isClient) {
    // Render children as-is during SSR to avoid hydration mismatch
    return <>{children}</>
  }

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  )
}
