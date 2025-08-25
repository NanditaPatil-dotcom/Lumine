"use client"

import { useState } from "react"
import { ProtectedLayout } from "@/components/layout/protected-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { CalendarGrid } from "@/components/calendar/calendar-grid"
import { EventDialog } from "@/components/calendar/event-dialog"
import { UpcomingEvents } from "@/components/calendar/upcoming-events"
import { Inter } from "next/font/google"
import {Lekton} from "next/font/google"
// ✅ Proper font setup
const lekton = Lekton({ subsets: ["latin"],weight: ["400", "700"]})

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  return (
    <ProtectedLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-6">
            <div>
              <h1 className={`text-3xl font-bold ${lekton.className}`}>Calendar</h1>
              <p className="text-muted-foreground">Track your study schedule and reminders</p>
            </div>

            <EventDialog selectedDate={selectedDate} onClose={() => setSelectedDate(null)}>
              <Button className="bg-black/50 text-white rounded-lg border-0">
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </EventDialog>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="bg-black/50 text-white rounded-lg border-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="bg-black/50 text-white rounded-lg border-0">
                Today
              </Button>
              <Button variant="outline" size="sm" className="bg-black/50 text-white rounded-lg border-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
            {/* Calendar Grid */}
            <div className="lg:col-span-3">
              <CalendarGrid onCreateEvent={setSelectedDate} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Force styles inside UpcomingEvents */}
              <div className="[&_*]:bg-black/50 [&_*]:text-white [&_*]:rounded-lg [&_*]:border-0 [&_*]:ring-0">
                <UpcomingEvents />
              </div>

              <Card className="bg-black/50 text-white rounded-lg border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Study Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Notes reviewed</span>
                    <span className="text-sm font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Study streak</span>
                    <span className="text-sm font-medium">5 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Due today</span>
                    <span className="text-sm font-medium text-accent">3</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}
