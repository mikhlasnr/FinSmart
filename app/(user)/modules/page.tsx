"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, where } from "firebase/firestore"
import { db } from "@/firebase/config"
import { useAuth } from "@/lib/auth-context"
import { Module, ExamResult } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BookOpen, CheckCircle2, Trophy, User } from "lucide-react"
import Link from "next/link"

export default function ModulesPage() {
  const { user } = useAuth()
  const [modules, setModules] = useState<Module[]>([])
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [leaderboardDialogOpen, setLeaderboardDialogOpen] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<ExamResult[]>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchModules()
    if (user) {
      fetchCompletedModules()
    }
  }, [user])

  const fetchModules = async () => {
    try {
      const modulesRef = collection(db, "modules")
      const q = query(modulesRef, orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)
      const modulesData: Module[] = []
      snapshot.forEach((doc) => {
        modulesData.push({
          id: doc.id,
          ...doc.data(),
        } as Module)
      })
      setModules(modulesData)
    } catch (error) {
      console.error("Error fetching modules:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompletedModules = async () => {
    if (!user) return

    try {
      const resultsRef = collection(db, "exam_results")
      const q = query(resultsRef, where("userId", "==", user.uid))
      const snapshot = await getDocs(q)
      const completed = new Set<string>()
      snapshot.forEach((doc) => {
        const result = doc.data() as ExamResult
        if (result.totalScore > 0) {
          completed.add(result.moduleId)
        }
      })
      setCompletedModules(completed)
    } catch (error) {
      console.error("Error fetching completed modules:", error)
    }
  }

  const fetchLeaderboard = async (moduleId: string) => {
    setLoadingLeaderboard(true)
    try {
      const resultsRef = collection(db, "exam_results")
      const q = query(resultsRef, where("moduleId", "==", moduleId))
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
    } finally {
      setLoadingLeaderboard(false)
    }
  }

  const handleOpenLeaderboard = (moduleId: string) => {
    setSelectedModuleId(moduleId)
    setLeaderboardDialogOpen(true)
    fetchLeaderboard(moduleId)
  }

  const selectedModule = modules.find((m) => m.id === selectedModuleId)

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
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
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
        <h1 className="text-3xl font-bold">Learning Modules</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Explore financial literacy modules and enhance your knowledge
        </p>
      </div>

      {modules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-[hsl(var(--muted-foreground))] mb-4" />
            <h3 className="text-lg font-semibold mb-2">No modules available</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Check back later for new learning modules
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const isCompleted = completedModules.has(module.id)
            const isNew = !completedModules.has(module.id)

            return (
              <Card key={module.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg pr-2">{module.title}</CardTitle>
                    {isCompleted && (
                      <Badge variant="default" className="shrink-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                    {isNew && (
                      <Badge variant="secondary" className="shrink-0">
                        New
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href={`/modules/${module.id}`}>
                    <Button className="w-full" variant={isCompleted ? "outline" : "default"}>
                      {isCompleted ? "Review Module" : "View Module"}
                    </Button>
                  </Link>
                  <div className="h-2"></div>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleOpenLeaderboard(module.id)}
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    Top Learners
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Leaderboard Dialog */}
      <Dialog open={leaderboardDialogOpen} onOpenChange={setLeaderboardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Top Learners
            </DialogTitle>
            <DialogDescription>
              {selectedModule ? selectedModule.title : "Module Leaderboard"}
            </DialogDescription>
          </DialogHeader>

          {loadingLeaderboard ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.map((result, index) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[hsl(var(--muted))] text-sm font-semibold">
                      {index + 1}
                    </div>
                    <Avatar className="h-8 w-8">
                      {result.userAvatar &&
                        typeof result.userAvatar === "string" &&
                        result.userAvatar.trim() !== "" &&
                        !imageErrors[result.id] ? (
                        <AvatarImage
                          src={result.userAvatar}
                          alt={result.userDisplayName || "User"}
                          onError={() =>
                            setImageErrors((prev) => ({ ...prev, [result.id]: true }))
                          }
                        />
                      ) : null}
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{result.userDisplayName}</p>
                    </div>
                  </div>
                  <Badge variant={index < 3 ? "default" : "secondary"}>
                    {result.totalScore} /{" "}
                    {result.answers.reduce((sum, a) => sum + a.maxScore, 0)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">
              No results yet
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

