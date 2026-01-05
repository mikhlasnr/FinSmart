"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/firebase/config"
import { useAuth } from "@/lib/auth-context"
import { ExamResult } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle2, XCircle, History, Eye, BookOpen } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

export default function ExamHistoryPage() {
  const { user } = useAuth()
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchExamHistory()
    }
  }, [user])

  const fetchExamHistory = async () => {
    if (!user) return

    try {
      const resultsRef = collection(db, "exam_results")
      const q = query(
        resultsRef,
        where("userId", "==", user.uid),
        orderBy("submittedAt", "desc")
      )
      const snapshot = await getDocs(q)

      const results: ExamResult[] = []
      snapshot.forEach((doc) => {
        results.push({
          id: doc.id,
          ...doc.data(),
        } as ExamResult)
      })

      // Sort by date in case orderBy fails (fallback)
      results.sort((a, b) => {
        const dateA = a.submittedAt instanceof Date
          ? a.submittedAt
          : a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(0)
        const dateB = b.submittedAt instanceof Date
          ? b.submittedAt
          : b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(0)
        return dateB.getTime() - dateA.getTime()
      })

      setExamResults(results)
    } catch (error) {
      console.error("Error fetching exam history:", error)
      // Fallback: try without orderBy
      try {
        const resultsRef = collection(db, "exam_results")
        const q = query(resultsRef, where("userId", "==", user.uid))
        const snapshot = await getDocs(q)

        const results: ExamResult[] = []
        snapshot.forEach((doc) => {
          results.push({
            id: doc.id,
            ...doc.data(),
          } as ExamResult)
        })

        // Sort by date manually
        results.sort((a, b) => {
          const dateA = a.submittedAt instanceof Date
            ? a.submittedAt
            : a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(0)
          const dateB = b.submittedAt instanceof Date
            ? b.submittedAt
            : b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(0)
          return dateB.getTime() - dateA.getTime()
        })

        setExamResults(results)
      } catch (fallbackError) {
        console.error("Error in fallback fetch:", fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (result: ExamResult) => {
    setSelectedResult(result)
    setDialogOpen(true)
  }

  const getPercentage = (result: ExamResult) => {
    const totalMaxScore = result.answers.reduce((sum, a) => sum + a.maxScore, 0)
    return Math.round((result.totalScore / totalMaxScore) * 100)
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const formatDate = (date: Date | any) => {
    try {
      if (date?.toDate) {
        return format(date.toDate(), "PPp")
      }
      if (date instanceof Date) {
        return format(date, "PPp")
      }
      return "Unknown date"
    } catch (error) {
      return "Invalid date"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          Exam History
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          View all your exam results and detailed feedback
        </p>
      </div>

      {examResults.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <History className="h-12 w-12 text-[hsl(var(--muted-foreground))] mb-4" />
            <h3 className="text-lg font-semibold mb-2">No exam history yet</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              Complete an exam to see your results here
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Exam Results</CardTitle>
            <CardDescription>
              Click on any row to view detailed results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Percentage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examResults.map((result) => {
                  const percentage = getPercentage(result)
                  const totalMaxScore = result.answers.reduce(
                    (sum, a) => sum + a.maxScore,
                    0
                  )

                  return (
                    <TableRow
                      key={result.id}
                      onClick={() => handleViewDetails(result)}
                    >
                      <TableCell className="font-medium">
                        {result.moduleTitle}
                      </TableCell>
                      <TableCell>{formatDate(result.submittedAt)}</TableCell>
                      <TableCell className="text-center">
                        {result.totalScore} / {totalMaxScore}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={getScoreColor(percentage)}>
                          {percentage}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/modules/${result.moduleId}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <BookOpen className="mr-2 h-4 w-4" />
                              Go to Module
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewDetails(result)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exam Results Details</DialogTitle>
            <DialogDescription>
              {selectedResult && (
                <>
                  {selectedResult.moduleTitle} -{" "}
                  {formatDate(selectedResult.submittedAt)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedResult && (
            <div className="space-y-6">
              {/* Summary Card */}
              <Card
                className={`border-2 ${getPercentage(selectedResult) >= 80
                  ? "bg-green-50 border-green-200"
                  : getPercentage(selectedResult) >= 50
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-red-50 border-red-200"
                  }`}
              >
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <div
                    className={`text-5xl font-bold mb-2 ${getScoreColor(
                      getPercentage(selectedResult)
                    )}`}
                  >
                    {getPercentage(selectedResult)}%
                  </div>
                  <p className="text-lg font-semibold mb-1">Exam Completed</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                    Score: {selectedResult.totalScore} /{" "}
                    {selectedResult.answers.reduce(
                      (sum, a) => sum + a.maxScore,
                      0
                    )}
                  </p>
                  <Link href={`/modules/${selectedResult.moduleId}`}>
                    <Button variant="outline" size="sm">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Go to Module
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Detailed Answers */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Detailed Results</h3>
                {selectedResult.answers.map((answer, index) => (
                  <div
                    key={answer.questionId}
                    className="space-y-3 p-4 border rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold">
                        Question {index + 1}: {answer.question}
                      </h4>
                      <div className="flex items-center gap-2">
                        {answer.finalScore === answer.maxScore ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-semibold">
                          {answer.finalScore} / {answer.maxScore}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">
                          Your Answer:
                        </p>
                        <p className="text-sm bg-[hsl(var(--muted))] p-3 rounded-md">
                          {answer.userAnswer}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">
                          Key Answer:
                        </p>
                        <p className="text-sm bg-green-50 p-3 rounded-md border border-green-200">
                          {answer.keyAnswer}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">
                          Similarity Score: {answer.similarityScore.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

