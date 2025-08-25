"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, BookOpen, Bell, User, Check } from "lucide-react"
import { useCalendar } from "@/contexts/calendar-context"
import { cn } from "@/lib/utils"

export function UpcomingEvents() {
  const { getUpcomingEvents, markEventCompleted } = useCalendar()
  const upcomingEvents = getUpcomingEvents(7)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "study":
        return <BookOpen className="h-4 w-4" />
      case "review":
        return <Calendar className="h-4 w-4" />
      case "reminder":
        return <Bell className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "study":
        return "bg-blue-500"
      case "review":
        return "bg-accent"
      case "reminder":
        return "bg-orange-500"
      default:
        return "bg-purple-500"
    }
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  const formatTime = (date: Date, time?: string) => {
    if (time) {
      return time
    }
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center  py-4">No upcoming events</p>
        ) : (
          upcomingEvents.map((event) => (
            <div
              key={event.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-colors",
                event.completed ? "bg-muted/50 opacity-75" : "bg-background hover:bg-muted/50",
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={cn("w-2 h-2 rounded-full", getTypeColor(event.type))} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(event.type)}
                    <span className={cn("text-sm font-medium truncate", event.completed && "line-through")}>
                      {event.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{formatDate(event.date)}</span>
                    {event.time && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(event.date, event.time)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {!event.completed && (
                <Button size="sm" variant="ghost" onClick={() => markEventCompleted(event.id)} className="h-8 w-8 p-0">
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
