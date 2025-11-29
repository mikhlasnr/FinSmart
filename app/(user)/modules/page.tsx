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
import { BookOpen, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function ModulesPage() {
  const { user } = useAuth()
  const [modules, setModules] = useState<Module[]>([])
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

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
                <CardContent>
                  <Link href={`/modules/${module.id}`}>
                    <Button className="w-full" variant={isCompleted ? "outline" : "default"}>
                      {isCompleted ? "Review Module" : "View Module"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

