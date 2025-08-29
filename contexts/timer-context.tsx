"use client"

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"

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

export function TimerProvider({ children, defaultMinutes = 25 }: TimerProviderProps) {
  const [defaultMinutesState, setDefaultMinutesState] = useState(defaultMinutes)
  const targetMs = defaultMinutesState * 60 * 1000
  
  const startedAtRef = useRef<number | null>(null)
  
  // Ensure we're on the client side
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  if (!isClient) {
    return <>{children}</>
  }
  
  // Load timer state from localStorage on mount
  const [elapsedMs, setElapsedMs] = useState<number>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("studyTimer:elapsedMs")
        const wasRunning = localStorage.getItem("studyTimer:isRunning") === "true"
        const startTime = localStorage.getItem("studyTimer:startTime")
        
        if (wasRunning && startTime) {
          const now = Date.now()
          const start = parseInt(startTime, 10)
          const elapsed = now - start
          const currentTargetMs = defaultMinutes * 60 * 1000
          
          // If the timer was running and hasn't completed, restore the start time
          if (elapsed < currentTargetMs) {
            startedAtRef.current = start
          }
          
          return Math.min(elapsed, currentTargetMs)
        }
        
        return saved ? parseInt(saved, 10) : 0
      }
      return 0
    } catch (error) {
      console.warn("Error loading timer state:", error)
      return 0
    }
  })
  
  const [isRunning, setIsRunning] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("studyTimer:isRunning")
        return saved === "true"
      }
      return false
    } catch (error) {
      console.warn("Error loading timer running state:", error)
      return false
    }
  })

  // Derived progress 0..1
  const progress = useMemo(() => {
    const clamped = Math.max(0, Math.min(1, elapsedMs / targetMs))
    return clamped
  }, [elapsedMs, targetMs])

  // Save elapsedMs to localStorage whenever it changes
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("studyTimer:elapsedMs", elapsedMs.toString())
      }
    } catch (error) {
      console.warn("Error saving timer state:", error)
    }
  }, [elapsedMs])



  useEffect(() => {
    if (!isRunning) return

    // Restore start time from localStorage if it exists
    if (startedAtRef.current == null) {
      const savedStartTime = localStorage.getItem("studyTimer:startTime")
      if (savedStartTime) {
        startedAtRef.current = parseInt(savedStartTime, 10)
      } else {
        startedAtRef.current = Date.now()
      }
    }
    
    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - (startedAtRef.current ?? now)
      
      if (elapsed >= targetMs) {
        completeSession(targetMs)
      } else {
        setElapsedMs(elapsed)
      }
    }, 100) // Update every 100ms for smooth display

    return () => clearInterval(interval)
  }, [isRunning, targetMs])

  // Handle page visibility changes to ensure timer continues running
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isRunning && startedAtRef.current) {
        // Recalculate elapsed time when page becomes visible again
        const now = Date.now()
        const elapsed = now - startedAtRef.current
        if (elapsed < targetMs) {
          setElapsedMs(elapsed)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isRunning, targetMs])

  const start = () => {
    try {
      if (elapsedMs >= targetMs) setElapsedMs(0)
      const startTime = Date.now()
      startedAtRef.current = startTime
      setIsRunning(true)
      if (typeof window !== "undefined") {
        localStorage.setItem("studyTimer:isRunning", "true")
        localStorage.setItem("studyTimer:startTime", startTime.toString())
      }
    } catch (error) {
      console.warn("Error starting timer:", error)
    }
  }

  const pause = () => {
    try {
      setIsRunning(false)
      if (typeof window !== "undefined") {
        localStorage.setItem("studyTimer:isRunning", "false")
        // Don't remove startTime immediately - keep it for potential resume
      }
    } catch (error) {
      console.warn("Error pausing timer:", error)
    }
  }

  const reset = () => {
    try {
      pause()
      startedAtRef.current = null
      setElapsedMs(0)
      if (typeof window !== "undefined") {
        localStorage.setItem("studyTimer:elapsedMs", "0")
        localStorage.removeItem("studyTimer:startTime")
      }
    } catch (error) {
      console.warn("Error resetting timer:", error)
    }
  }

  const setDefaultMinutes = (minutes: number) => {
    setDefaultMinutesState(minutes)
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

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}
