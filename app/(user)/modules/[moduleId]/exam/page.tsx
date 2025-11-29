"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { collection, query, where, getDocs, doc, getDoc, addDoc, Timestamp } from "firebase/firestore"
import { db } from "@/firebase/config"
import { useAuth } from "@/lib/auth-context"
import { Exam, Module, ExamResult, ExamResultAnswer } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FormField, FormTextarea } from "@/components/ui/form-field"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"

// Simple text similarity function (mock scoring)
function calculateSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) => text.toLowerCase().trim()
  const t1 = normalize(text1)
  const t2 = normalize(text2)

  if (t1 === t2) return 1.0
  if (t1.includes(t2) || t2.includes(t1)) return 0.8
  if (t1.length === 0 || t2.length === 0) return 0

  // Simple word overlap
  const words1 = new Set(t1.split(/\s+/))
  const words2 = new Set(t2.split(/\s+/))
  const intersection = new Set([...words1].filter((x) => words2.has(x)))
  const union = new Set([...words1, ...words2])
  return intersection.size / union.size
}

export default function ExamPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const moduleId = params.moduleId as string

  const [module, setModule] = useState<Module | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ExamResult | null>(null)

  // Create dynamic schema based on exams
  const createExamSchema = (exams: Exam[]) => {
    const schemaObject: Record<string, z.ZodString> = {}
    exams.forEach((exam) => {
      schemaObject[exam.id] = z.string().min(1, "Answer is required")
    })
    return z.object(schemaObject)
  }

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createExamSchema(exams)),
  })

  useEffect(() => {
    if (moduleId) {
      fetchData()
    }
  }, [moduleId])

  const fetchData = async () => {
    try {
      // Fetch module
      const moduleRef = doc(db, "modules", moduleId)
      const moduleSnap = await getDoc(moduleRef)
      if (moduleSnap.exists()) {
        setModule({
          id: moduleSnap.id,
          ...moduleSnap.data(),
        } as Module)
      }

      // Fetch exams
      const examsRef = collection(db, "exams")
      const q = query(examsRef, where("moduleId", "==", moduleId))
      const snapshot = await getDocs(q)
      const examsData: Exam[] = []
      snapshot.forEach((doc) => {
        examsData.push({
          id: doc.id,
          ...doc.data(),
        } as Exam)
      })
      setExams(examsData)
    } catch (error) {
      console.error("Error fetching exam data:", error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: Record<string, string>) => {
    if (!user || !module || exams.length === 0) return

    setSubmitting(true)

    try {
      // Calculate scores
      const answers: ExamResultAnswer[] = []
      let totalScore = 0

      exams.forEach((exam) => {
        const userAnswer = data[exam.id] || ""
        const similarityScore = calculateSimilarity(userAnswer, exam.keyAnswer)
        const finalScore = Math.round(similarityScore * exam.maxScore)

        answers.push({
          questionId: exam.id,
          question: exam.question,
          userAnswer,
          keyAnswer: exam.keyAnswer,
          maxScore: exam.maxScore,
          similarityScore,
          finalScore,
        })

        totalScore += finalScore
      })

      // Save to Firestore
      const resultData: Omit<ExamResult, "id"> = {
        userId: user.uid,
        userDisplayName: user.displayName || user.email?.split("@")[0] || "User",
        userEmail: user.email || "",
        userAvatar: user.photoURL || undefined,
        moduleId: module.id,
        moduleTitle: module.title,
        submittedAt: Timestamp.now(),
        totalScore,
        answers,
      }

      const docRef = await addDoc(collection(db, "exam_results"), resultData)

      // Set result for display
      setResult({
        id: docRef.id,
        ...resultData,
      })
    } catch (error) {
      console.error("Error submitting exam:", error)
      alert("An error occurred while submitting the exam. Please try again.")
    } finally {
      setSubmitting(false)
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
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!module || exams.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">
              {!module ? "Module not found" : "No exam questions available"}
            </h3>
            <Link href={`/modules/${moduleId}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Module
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show result if exam is submitted
  if (result) {
    const percentage = Math.round(
      (result.totalScore / result.answers.reduce((sum, a) => sum + a.maxScore, 0)) * 100
    )
    const scoreColor =
      percentage >= 80
        ? "text-green-600"
        : percentage >= 50
        ? "text-yellow-600"
        : "text-red-600"
    const scoreBg =
      percentage >= 80
        ? "bg-green-50 border-green-200"
        : percentage >= 50
        ? "bg-yellow-50 border-yellow-200"
        : "bg-red-50 border-red-200"

    return (
      <div className="space-y-6">
        <Card className={`${scoreBg} border-2`}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className={`text-6xl font-bold mb-4 ${scoreColor}`}>
              {percentage}%
            </div>
            <h2 className="text-2xl font-semibold mb-2">Exam Completed!</h2>
            <p className="text-[hsl(var(--muted-foreground))] mb-6">
              Your score: {result.totalScore} /{" "}
              {result.answers.reduce((sum, a) => sum + a.maxScore, 0)}
            </p>
            <div className="flex gap-4">
              <Link href={`/modules/${moduleId}`}>
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Module
                </Button>
              </Link>
              <Button
                onClick={() => {
                  setResult(null)
                  router.refresh()
                }}
              >
                Retake Exam
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detailed Results</CardTitle>
            <CardDescription>Review your answers and the correct answers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {result.answers.map((answer, index) => (
              <div key={answer.questionId} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">
                    Question {index + 1}: {answer.question}
                  </h3>
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
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/modules/${moduleId}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Module
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{module.title} - Exam</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Answer all questions below. Take your time and provide detailed answers.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {exams.map((exam, index) => (
          <Card key={exam.id}>
            <CardHeader>
              <CardTitle>
                Question {index + 1} of {exams.length}
              </CardTitle>
              <CardDescription>Maximum score: {exam.maxScore} points</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg font-medium">{exam.question}</p>
              <FormField
                label="Your Answer"
                error={errors[exam.id]?.message as string}
                required
              >
                <Controller
                  name={exam.id}
                  control={control}
                  render={({ field }) => (
                    <FormTextarea
                      {...field}
                      placeholder="Type your answer here..."
                      className="min-h-[150px]"
                      error={errors[exam.id]?.message as string}
                    />
                  )}
                />
              </FormField>
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end gap-4">
          <Link href={`/modules/${moduleId}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={submitting} size="lg">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Exam"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

