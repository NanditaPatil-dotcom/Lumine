"use client"

import { ProtectedLayout } from "@/components/layout/protected-layout"
import { SpacedRepetitionProvider } from "@/contexts/spaced-repetition-context"
import { ReviewDashboard } from "@/components/spaced-repetition/review-dashboard"

export default function ReviewPage() {
  return (
    <ProtectedLayout>
      <SpacedRepetitionProvider>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="p-6">
              <h1 className="text-3xl font-serif font-bold">Spaced Repetition</h1>
              <p className="text-muted-foreground">Review your notes using scientifically-proven learning techniques</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-auto">
            <ReviewDashboard />
          </div>
        </div>
      </SpacedRepetitionProvider>
    </ProtectedLayout>
  )
}
