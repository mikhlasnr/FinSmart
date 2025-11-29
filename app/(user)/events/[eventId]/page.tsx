"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/firebase/config"
import { Event, EventCategory } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, ArrowLeft, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { Timestamp } from "firebase/firestore"

export default function EventDetailPage() {
  const params = useParams()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [category, setCategory] = useState<EventCategory | null>(null)
  const [otherEvents, setOtherEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (eventId) {
      fetchEvent()
      fetchOtherEvents()
      fetchCategories()
    }
  }, [eventId])

  const fetchEvent = async () => {
    try {
      // Fetch event
      const eventRef = doc(db, "events", eventId)
      const eventSnap = await getDoc(eventRef)

      if (eventSnap.exists()) {
        const data = eventSnap.data()
        let startDate = data.startDate
        let endDate = data.endDate

        // Convert Firestore Timestamp to Date if needed
        if (startDate?.toDate) {
          startDate = startDate.toDate()
        }
        if (endDate?.toDate) {
          endDate = endDate.toDate()
        }

        const eventData = {
          id: eventSnap.id,
          ...data,
          startDate,
          endDate,
        } as Event

        setEvent(eventData)

        // Fetch category
        if (eventData.categoryId) {
          const categoryRef = doc(db, "eventCategories", eventData.categoryId)
          const categorySnap = await getDoc(categoryRef)
          if (categorySnap.exists()) {
            setCategory({
              id: categorySnap.id,
              ...categorySnap.data(),
            } as EventCategory)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching event:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOtherEvents = async () => {
    try {
      const eventsRef = collection(db, "events")
      const q = query(eventsRef, orderBy("startDate", "asc"))
      const snapshot = await getDocs(q)
      const eventsData: Event[] = []

      for (const docSnap of snapshot.docs) {
        // Skip current event
        if (docSnap.id === eventId) continue

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

      // Limit to 6 events
      setOtherEvents(eventsData.slice(0, 6))
    } catch (error) {
      console.error("Error fetching other events:", error)
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
    const cat = categories.find((c) => c.id === categoryId)
    return cat?.name || "Unknown"
  }

  const getEventStatus = (eventItem: Event) => {
    const now = new Date()
    const start = eventItem.startDate instanceof Date
      ? eventItem.startDate
      : eventItem.startDate instanceof Timestamp
        ? eventItem.startDate.toDate()
        : new Date(eventItem.startDate)
    const end = eventItem.endDate instanceof Date
      ? eventItem.endDate
      : eventItem.endDate instanceof Timestamp
        ? eventItem.endDate.toDate()
        : new Date(eventItem.endDate)

    if (now < start) return "upcoming"
    if (now >= start && now <= end) return "ongoing"
    return "ended"
  }

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, "").substring(0, 150) + "..."
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">Event not found</h3>
            <Link href="/events">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Events
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">{event.title}</h1>
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
        {category && (
          <Badge variant="secondary" className="mb-2">
            {category.name}
          </Badge>
        )}
        <div className="flex items-center gap-2 mt-2 text-[hsl(var(--muted-foreground))]">
          <Calendar className="h-4 w-4" />
          <span>
            {format(startDate, "dd MMMM yyyy")} - {format(endDate, "dd MMMM yyyy")}
          </span>
        </div>
      </div>

      {/* Event Content */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Event Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="event-content prose max-w-none"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          </CardContent>
        </Card>

        {/* Sticky Bottom Bar */}
        {event.registrationLink && (
          <div className="sticky bottom-0 bg-[hsl(var(--background))] border-t border-[hsl(var(--border))] p-4 -mx-6 lg:mx-0 lg:rounded-lg lg:border lg:shadow-sm">
            <div className="flex gap-4">
              <a
                href={event.registrationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full" size="lg">
                  Register Now
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Other Events */}
      {otherEvents.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Other Events</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {otherEvents.map((otherEvent) => {
              const otherStatus = getEventStatus(otherEvent)
              const otherStartDate = otherEvent.startDate instanceof Date
                ? otherEvent.startDate
                : otherEvent.startDate instanceof Timestamp
                  ? otherEvent.startDate.toDate()
                  : new Date(otherEvent.startDate)
              const otherEndDate = otherEvent.endDate instanceof Date
                ? otherEvent.endDate
                : otherEvent.endDate instanceof Timestamp
                  ? otherEvent.endDate.toDate()
                  : new Date(otherEvent.endDate)

              return (
                <Card key={otherEvent.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary">{getCategoryName(otherEvent.categoryId)}</Badge>
                      <Badge
                        variant={
                          otherStatus === "upcoming"
                            ? "default"
                            : otherStatus === "ongoing"
                              ? "default"
                              : "outline"
                        }
                      >
                        {otherStatus === "upcoming"
                          ? "Upcoming"
                          : otherStatus === "ongoing"
                            ? "Ongoing"
                            : "Ended"}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{otherEvent.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Calendar className="h-4 w-4" />
                      {format(otherStartDate, "dd MMM yyyy")} - {format(otherEndDate, "dd MMM yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-3 mb-4">
                      {stripHtml(otherEvent.description)}
                    </p>
                    <div className="flex flex-col gap-2">
                      <Link href={`/events/${otherEvent.id}`} className="w-full">
                        <Button className="w-full" variant="outline">
                          View Details
                        </Button>
                      </Link>
                      {otherEvent.registrationLink && (
                        <a
                          href={otherEvent.registrationLink}
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
        </div>
      )}
    </div>
  )
}

