"use client"

import { useState } from "react"
import { Search, Filter, SortAsc } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function NotesFilters() {
  const [localSearchQuery, setLocalSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("updated-desc")

  return (
    <div className="p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
          <Input
            placeholder="Search notes..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10 bg-black/50 text-white border-0 rounded-lg placeholder:text-white/70"
          />
        </div>

        {/* Category, Sort & Filters */}
        <div className="flex items-center gap-2">
          {/* Category filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40 bg-black/50 text-white border-0 rounded-lg">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 text-white border-0">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="study">Study</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48 bg-black/50 text-white border-0 rounded-lg">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 text-white border-0">
              <SelectItem value="updated-desc">Recently Updated</SelectItem>
              <SelectItem value="updated-asc">Oldest First</SelectItem>
              <SelectItem value="title-asc">Title A-Z</SelectItem>
              <SelectItem value="title-desc">Title Z-A</SelectItem>
            </SelectContent>
          </Select>

          {/* Filters button */}
          <Button
            variant="outline"
            size="sm"
            className="relative bg-black/50 text-white border-0 rounded-lg"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>
    </div>
  )
}
