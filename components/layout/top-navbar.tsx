"use client"

import { StudyTimer } from "@/components/notes/study-timer"

export function TopNavbar() {
  return (
    <div className="fixed top-0 right-4 z-50 p-4">
      <StudyTimer defaultMinutes={25} />
    </div>
  )
}
