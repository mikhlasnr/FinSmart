import { NextRequest, NextResponse } from "next/server"

/**
 * API Route untuk AI Essay Scoring
 * Menerima jawaban exam dan mengembalikan skor dari AI model
 */

// URL Cloud Function - set di .env.local atau .env
const AI_SCORING_URL =
  process.env.AI_SCORING_URL ||
  "http://localhost:5001/YOUR_PROJECT_ID/asia-southeast1/score_exam"

interface ScoringAnswer {
  question_id: string
  key_answer: string
  student_answer: string
  max_score: number
}

interface ScoringResult {
  question_id: string
  similarity_score: number
  final_score: number
  max_score: number
}

interface ExamScoringResponse {
  results: ScoringResult[]
  total_score: number
  total_max_score: number
  status: "success" | "error"
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { answers } = body as { answers: ScoringAnswer[] }

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "answers array is required", status: "error" },
        { status: 400 }
      )
    }

    // Coba panggil Cloud Function
    try {
      const response = await fetch(AI_SCORING_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
        // Timeout 60 detik (untuk handle cold start)
        signal: AbortSignal.timeout(60000),
      })

      if (response.ok) {
        const data: ExamScoringResponse = await response.json()
        if (data.status === "success") {
          return NextResponse.json(data)
        } else {
          console.warn("Cloud Function returned error:", data.error)
          // Fall through to fallback
        }
      } else {
        console.warn(
          `Cloud Function returned status ${response.status}, using fallback`
        )
      }
    } catch (fetchError) {
      console.log(
        "Cloud Function not available, using fallback scoring:",
        fetchError instanceof Error ? fetchError.message : String(fetchError)
      )
    }

    // Fallback scoring jika Cloud Function tidak tersedia
    const results: ScoringResult[] = answers.map((answer) => {
      const similarity = calculateSimpleSimilarity(
        answer.key_answer,
        answer.student_answer
      )
      const finalScore = Math.round(similarity * answer.max_score)

      return {
        question_id: answer.question_id,
        similarity_score: parseFloat(similarity.toFixed(4)),
        final_score: finalScore,
        max_score: answer.max_score,
      }
    })

    const totalScore = results.reduce((sum, r) => sum + r.final_score, 0)
    const totalMaxScore = results.reduce((sum, r) => sum + r.max_score, 0)

    return NextResponse.json({
      results,
      total_score: totalScore,
      total_max_score: totalMaxScore,
      status: "success",
    })
  } catch (error) {
    console.error("Error in score-exam API:", error)
    return NextResponse.json(
      { error: "Internal server error", status: "error" },
      { status: 500 }
    )
  }
}

/**
 * Simple similarity calculation (fallback)
 * Menggunakan Jaccard similarity dari kata-kata
 */
function calculateSimpleSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) => text.toLowerCase().trim()
  const t1 = normalize(text1)
  const t2 = normalize(text2)

  if (t1 === t2) return 1.0
  if (t1.length === 0 || t2.length === 0) return 0

  // Jaccard similarity
  const words1 = new Set(t1.split(/\s+/).filter((w) => w.length > 2))
  const words2 = new Set(t2.split(/\s+/).filter((w) => w.length > 2))
  const intersection = new Set([...words1].filter((x) => words2.has(x)))
  const union = new Set([...words1, ...words2])

  if (union.size === 0) return 0
  return intersection.size / union.size
}

