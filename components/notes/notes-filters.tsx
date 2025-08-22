"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Search, Filter, X, Tag, Calendar, Brain, Pin, Archive, SortAsc } from "lucide-react"
import { useNotes } from "@/contexts/notes-context"

export function NotesFilters() {
  const {
    searchQuery,
    selectedTags,
    selectedCategory,
    searchNotes,
    filterByTags,
    filterByCategory,
    allTags,
    categories,
  } = useNotes()

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [sortBy, setSortBy] = useState("updated")
  const [sortOrder, setSortOrder] = useState("desc")
  const [showPinned, setShowPinned] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [difficultyRange, setDifficultyRange] = useState([0, 5])
  const [dateRange, setDateRange] = useState("all")

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    searchNotes(localSearchQuery)
  }

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag]
    filterByTags(newTags)
  }

  const clearFilters = () => {
    setLocalSearchQuery("")
    searchNotes("")
    filterByTags([])
    filterByCategory("all")
    setSortBy("updated")
    setSortOrder("desc")
    setShowPinned(true)
    setShowArchived(false)
    setDifficultyRange([0, 5])
    setDateRange("all")
  }

  const hasActiveFilters =
    searchQuery ||
    selectedTags.length > 0 ||
    selectedCategory !== "all" ||
    sortBy !== "updated" ||
    sortOrder !== "desc" ||
    !showPinned ||
    showArchived ||
    difficultyRange[0] !== 0 ||
    difficultyRange[1] !== 5 ||
    dateRange !== "all"

  return (
    <div className="border-b border-border bg-muted/50 p-4">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-10"
          />
        </form>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={filterByCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="study">Study</SelectItem>
            <SelectItem value="work">Work</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Options */}
        <Select
          value={`${sortBy}-${sortOrder}`}
          onValueChange={(value) => {
            const [sort, order] = value.split("-")
            setSortBy(sort)
            setSortOrder(order)
          }}
        >
          <SelectTrigger className="w-48">
            <SortAsc className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated-desc">Recently Updated</SelectItem>
            <SelectItem value="updated-asc">Oldest Updated</SelectItem>
            <SelectItem value="created-desc">Recently Created</SelectItem>
            <SelectItem value="created-asc">Oldest Created</SelectItem>
            <SelectItem value="title-asc">Title A-Z</SelectItem>
            <SelectItem value="title-desc">Title Z-A</SelectItem>
            <SelectItem value="difficulty-desc">Hardest First</SelectItem>
            <SelectItem value="difficulty-asc">Easiest First</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative bg-transparent">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {(selectedTags.length > 0 ||
                !showPinned ||
                showArchived ||
                difficultyRange[0] !== 0 ||
                difficultyRange[1] !== 5 ||
                dateRange !== "all") && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                  !
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Advanced Filters</h4>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Reset All
                </Button>
              </div>

              {/* Tags Filter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Tags</Label>
                  {selectedTags.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => filterByTags([])}>
                      Clear
                    </Button>
                  )}
                </div>

                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map((tag) => (
                      <Badge key={tag} variant="default" className="flex items-center gap-1">
                        {tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => handleTagToggle(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {allTags
                    .filter((tag) => !selectedTags.includes(tag))
                    .map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleTagToggle(tag)}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                </div>
              </div>

              {/* Status Filters */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Status</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Pin className="h-4 w-4" />
                      <span className="text-sm">Show Pinned</span>
                    </div>
                    <Switch checked={showPinned} onCheckedChange={setShowPinned} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Archive className="h-4 w-4" />
                      <span className="text-sm">Show Archived</span>
                    </div>
                    <Switch checked={showArchived} onCheckedChange={setShowArchived} />
                  </div>
                </div>
              </div>

              {/* Difficulty Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Difficulty Range: {difficultyRange[0]} - {difficultyRange[1]}
                </Label>
                <Slider
                  value={difficultyRange}
                  onValueChange={setDifficultyRange}
                  max={5}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Easy</span>
                  <span>Hard</span>
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Spaced Repetition Filters */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Spaced Repetition</Label>
                <Select>
                  <SelectTrigger>
                    <Brain className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Review Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Notes</SelectItem>
                    <SelectItem value="enabled">SR Enabled</SelectItem>
                    <SelectItem value="due">Due for Review</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="new">New (Never Reviewed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary">
              Search: "{searchQuery}"
              <X
                className="h-3 w-3 ml-1 cursor-pointer"
                onClick={() => {
                  setLocalSearchQuery("")
                  searchNotes("")
                }}
              />
            </Badge>
          )}
          {selectedCategory !== "all" && (
            <Badge variant="secondary">
              Category: {selectedCategory}
              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => filterByCategory("all")} />
            </Badge>
          )}
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary">
              Tag: {tag}
              <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => handleTagToggle(tag)} />
            </Badge>
          ))}
          {sortBy !== "updated" && (
            <Badge variant="secondary">
              Sort: {sortBy} ({sortOrder})
            </Badge>
          )}
          {!showPinned && <Badge variant="secondary">Hide Pinned</Badge>}
          {showArchived && <Badge variant="secondary">Show Archived</Badge>}
        </div>
      )}
    </div>
  )
}
