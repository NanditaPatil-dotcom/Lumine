"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { useCalendar } from "@/contexts/calendar-context"
import { cn } from "@/lib/utils"

interface CalendarGridProps {
  onCreateEvent?: (date: Date) => void
}

export function CalendarGrid({ onCreateEvent }: CalendarGridProps) {
  const { currentDate, setCurrentDate, selectedDate, setSelectedDate, getEventsForDate } = useCalendar()

  const today = new Date()
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (direction === "prev") {
      newDate.setMonth(month - 1)
    } else {
      newDate.setMonth(month + 1)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(year, month, day)
    setSelectedDate(clickedDate)
    if (onCreateEvent) {
      onCreateEvent(clickedDate)
    }
  }

  const renderCalendarDays = () => {
    const days = []

    // Previous month's trailing days
    const prevMonth = new Date(year, month - 1, 0)
    const prevMonthDays = prevMonth.getDate()

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthDays - i
      days.push(
        <div
          key={`prev-${day}`}
          className="aspect-square p-2 text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors rounded-md"
        >
          {day}
        </div>,
      )
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isToday = date.toDateString() === today.toDateString()
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString()
      const events = getEventsForDate(date)
      const hasEvents = events.length > 0

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(day)}
          className={cn(
            "aspect-square p-2 text-sm border rounded-md cursor-pointer hover:bg-muted/50 transition-colors relative",
            isToday && "bg-primary text-primary-foreground hover:bg-primary/90",
            isSelected && !isToday && "bg-accent text-accent-foreground",
            hasEvents && !isToday && !isSelected && "border-accent",
          )}
        >
          <span className="font-medium">{day}</span>
          {hasEvents && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
              {events.slice(0, 3).map((event, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    event.type === "study" && "bg-blue-500",
                    event.type === "review" && "bg-accent",
                    event.type === "reminder" && "bg-orange-500",
                    event.type === "custom" && "bg-purple-500",
                  )}
                />
              ))}
              {events.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />}
            </div>
          )}
        </div>,
      )
    }

    // Next month's leading days
    const remainingDays = 42 - days.length // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <div
          key={`next-${day}`}
          className="aspect-square p-2 text-sm text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors rounded-md"
        >
          {day}
        </div>,
      )
    }

    return days
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {monthNames[month]} {year}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">{renderCalendarDays()}</div>
      </CardContent>
    </Card>
  )
}
