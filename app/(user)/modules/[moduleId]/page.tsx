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
import { CheckCircle2, FileText, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ModuleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const moduleId = params.moduleId as string

  const [module, setModule] = useState<Module | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasCompleted, setHasCompleted] = useState(false)

  useEffect(() => {
    if (moduleId) {
      fetchModule()
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

      <div className="space-y-6">
        {/* Main Content */}
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
    </div>
  )
}

