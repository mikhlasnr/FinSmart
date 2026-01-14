"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/firebase/config"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ExamResult } from "@/lib/types"
import { BookOpen, Award, FileText, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    modulesCompleted: 0,
    averageScore: 0,
    totalExams: 0,
  })
  const [recentModules, setRecentModules] = useState<any[]>([])

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    try {
      // Fetch exam results
      const resultsRef = collection(db, "exam_results")
      const q = query(resultsRef, where("userId", "==", user.uid))
      const resultsSnapshot = await getDocs(q)

      const results: ExamResult[] = []
      resultsSnapshot.forEach((doc) => {
        results.push({
          id: doc.id,
          ...doc.data(),
        } as ExamResult)
      })

      // Calculate stats
      const uniqueModules = new Set(results.map((r) => r.moduleId))
      const modulesCompleted = uniqueModules.size
      const totalExams = results.length
      const averageScore =
        results.length > 0
          ? results.reduce((sum, r) => sum + r.totalScore, 0) / results.length
          : 0

      setStats({
        modulesCompleted,
        averageScore: Math.round(averageScore),
        totalExams,
      })

      // Get recent modules (last 3 unique modules)
      const recentModuleIds = Array.from(uniqueModules).slice(0, 3)
      const modulesRef = collection(db, "modules")
      const modulesSnapshot = await getDocs(modulesRef)
      const allModules: any[] = []
      modulesSnapshot.forEach((doc) => {
        allModules.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      const recent = allModules
        .filter((m) => recentModuleIds.includes(m.id))
        .slice(0, 3)
      setRecentModules(recent)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-40 sm:w-64 mb-2" />
          <Skeleton className="h-4 w-48 sm:w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-4 sm:pb-6">
      {/* Hero Section */}
      <Card className="bg-linear-to-r from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 text-[hsl(var(--primary-foreground))]">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
          <CardTitle className="text-2xl sm:text-3xl text-center sm:text-left">
            Welcome back, {user?.displayName || "User"}!
          </CardTitle>
          <CardDescription className="mt-2 text-sm sm:text-base text-[hsl(var(--primary-foreground))]/80 text-center sm:text-left">
            Continue your financial literacy journey
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modules Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.modulesCompleted}</div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Learning modules finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Award className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}</div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Across all exams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <FileText className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExams}</div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Exams taken
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.modulesCompleted > 0 ? "Active" : "Start"}
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Learning status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">Continue Learning</h2>
          <Link href="/modules">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {recentModules.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentModules.map((module) => (
              <Card key={module.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {module.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/modules/${module.id}`}>
                    <Button className="w-full" variant="outline">
                      Continue Learning
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-[hsl(var(--muted-foreground))] mb-4" />
              <h3 className="text-lg font-semibold mb-2">No modules yet</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                Start your learning journey by exploring available modules
              </p>
              <Link href="/modules">
                <Button>
                  Browse Modules
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Browse Modules</CardTitle>
            <CardDescription>
              Explore all available learning modules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/modules">
              <Button className="w-full">
                View Modules
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View Events</CardTitle>
            <CardDescription>
              Discover financial literacy events and programs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/events">
              <Button className="w-full" variant="outline">
                View Events
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

