"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/firebase/config"
import { useAuth } from "@/lib/auth-context"
import { Module, ExamResult } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, FileText, Trophy, ArrowLeft, User } from "lucide-react"
import Link from "next/link"

export default function ModuleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const moduleId = params.moduleId as string

  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [leaderboard, setLeaderboard] = useState<ExamResult[]>([])
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (moduleId) {
      fetchModule()
      fetchLeaderboard()
      if (user) {
        checkCompletion()
      }
    }
  }, [moduleId, user])

  const fetchModule = async () => {
    try {
      const moduleRef = doc(db, "modules", moduleId)
      const moduleSnap = await getDoc(moduleRef)
      if (moduleSnap.exists()) {
        setModule({
          id: moduleSnap.id,
          ...moduleSnap.data(),
        } as Module)
      }
    } catch (error) {
      console.error("Error fetching module:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkCompletion = async () => {
    if (!user) return

    try {
      const resultsRef = collection(db, "exam_results")
      const q = query(
        resultsRef,
        where("userId", "==", user.uid),
        where("moduleId", "==", moduleId)
      )
      const snapshot = await getDocs(q)
      setHasCompleted(snapshot.size > 0)
    } catch (error) {
      console.error("Error checking completion:", error)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const resultsRef = collection(db, "exam_results")
      const q = query(
        resultsRef,
        where("moduleId", "==", moduleId)
      )
      const snapshot = await getDocs(q)
      const allResults: ExamResult[] = []
      snapshot.forEach((doc) => {
        allResults.push({
          id: doc.id,
          ...doc.data(),
        } as ExamResult)
      })
      // Sort by totalScore descending and limit to top 5
      const topResults = allResults
        .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
        .slice(0, 5)
      setLeaderboard(topResults)
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!module) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">Module not found</h3>
            <Link href="/modules">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Modules
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Link href="/modules">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Modules
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{module.title}</h1>
            {hasCompleted && (
              <Badge variant="default">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
          <p className="text-[hsl(var(--muted-foreground))] text-lg">
            {module.description}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="module-content prose max-w-none"
                dangerouslySetInnerHTML={{ __html: module.content }}
              />
            </CardContent>
          </Card>

          {/* Sticky Bottom Bar */}
          <div className="sticky bottom-0 bg-[hsl(var(--background))] border-t border-[hsl(var(--border))] p-4 -mx-6 lg:mx-0 lg:rounded-lg lg:border lg:shadow-sm">
            <div className="flex gap-4">
              <Link href={`/modules/${moduleId}/exam`} className="flex-1">
                <Button className="w-full" size="lg">
                  <FileText className="mr-2 h-4 w-4" />
                  {hasCompleted ? "Retake Exam" : "Take Exam"}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Top Learners
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((result, index) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-[hsl(var(--accent))] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[hsl(var(--muted))] text-sm font-semibold">
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          {result.userAvatar &&
                            typeof result.userAvatar === 'string' &&
                            result.userAvatar.trim() !== '' &&
                            !imageErrors[result.id] ? (
                            <AvatarImage
                              src={result.userAvatar}
                              alt={result.userDisplayName || "User"}
                              onError={() => setImageErrors(prev => ({ ...prev, [result.id]: true }))}
                            />
                          ) : null}
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {result.userDisplayName}
                          </p>
                        </div>
                      </div>
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        {result.totalScore}%
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">
                  No results yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

