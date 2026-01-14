"use client"

import { useState, useEffect, useMemo } from "react"
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore"
import { db } from "@/firebase/config"
import { Event, EventCategory } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar, Search } from "lucide-react"
import { format } from "date-fns"
import { Timestamp } from "firebase/firestore"
import Link from "next/link"

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    fetchEvents()
    fetchCategories()
  }, [])

  const fetchEvents = async () => {
    try {
      const eventsRef = collection(db, "events")
      const q = query(eventsRef, orderBy("startDate", "asc"))
      const snapshot = await getDocs(q)
      const eventsData: Event[] = []

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data()
        let startDate = data.startDate
        let endDate = data.endDate

        // Convert Firestore Timestamp to Date if needed
        if (startDate?.toDate) {
          startDate = startDate.toDate()
        }
        if (endDate?.toDate) {
          endDate = endDate.toDate()
        }

        eventsData.push({
          id: docSnap.id,
          ...data,
          startDate,
          endDate,
        } as Event)
      }

      setEvents(eventsData)
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const categoriesRef = collection(db, "eventCategories")
      const snapshot = await getDocs(categoriesRef)
      const categoriesData: EventCategory[] = []
      snapshot.forEach((doc) => {
        categoriesData.push({
          id: doc.id,
          ...doc.data(),
        } as EventCategory)
      })
      setCategories(categoriesData)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.name || "Unknown"
  }

  const getEventStatus = (event: Event) => {
    const now = new Date()
    const start = event.startDate instanceof Date
      ? event.startDate
      : event.startDate instanceof Timestamp
        ? event.startDate.toDate()
        : new Date(event.startDate)
    const end = event.endDate instanceof Date
      ? event.endDate
      : event.endDate instanceof Timestamp
        ? event.endDate.toDate()
        : new Date(event.endDate)

    if (now < start) return "upcoming"
    if (now >= start && now <= end) return "ongoing"
    return "ended"
  }

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase())

      // Category filter
      const matchesCategory =
        selectedCategory === "all" || event.categoryId === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [events, searchQuery, selectedCategory])

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, "").substring(0, 150) + "..."
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Events & Programs</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Discover financial literacy events and opportunities
        </p>
      </div>

      {/* Filter Area */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories">
                    {selectedCategory === "all"
                      ? "All Categories"
                      : getCategoryName(selectedCategory)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(searchQuery || selectedCategory !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-[hsl(var(--muted-foreground))] mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {searchQuery || selectedCategory !== "all"
                ? "Try adjusting your filters"
                : "Check back later for new events"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => {
            const status = getEventStatus(event)
            const startDate = event.startDate instanceof Date
              ? event.startDate
              : event.startDate instanceof Timestamp
                ? event.startDate.toDate()
                : new Date(event.startDate)
            const endDate = event.endDate instanceof Date
              ? event.endDate
              : event.endDate instanceof Timestamp
                ? event.endDate.toDate()
                : new Date(event.endDate)

            return (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary">{getCategoryName(event.categoryId)}</Badge>
                    <Badge
                      variant={
                        status === "upcoming"
                          ? "default"
                          : status === "ongoing"
                            ? "default"
                            : "outline"
                      }
                    >
                      {status === "upcoming"
                        ? "Upcoming"
                        : status === "ongoing"
                          ? "Ongoing"
                          : "Ended"}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" />
                    {format(startDate, "dd MMM yyyy")} - {format(endDate, "dd MMM yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-3 mb-4">
                    {stripHtml(event.description)}
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link href={`/events/${event.id}`} className="w-full">
                      <Button className="w-full" variant="outline">
                        View Details
                      </Button>
                    </Link>
                    {event.registrationLink && (
                      <a
                        href={event.registrationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button className="w-full">
                          Register
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

