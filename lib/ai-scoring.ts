/**
 * AI Scoring Service
 * Memanggil internal API route yang akan forward ke Firebase Cloud Function
 */

export interface ScoringAnswer {
  question_id: string
  key_answer: string
  student_answer: string
  max_score: number
}

export interface ScoringResult {
  question_id: string
  similarity_score: number
  final_score: number
  max_score: number
}

export interface ExamScoringResponse {
  results: ScoringResult[]
  total_score: number
  total_max_score: number
  status: "success" | "error"
  error?: string
}

/**
 * Mengirim seluruh jawaban exam ke AI scoring API
 * Menggunakan internal API route /api/score-exam
 */
export async function scoreExamWithAI(
  answers: ScoringAnswer[]
): Promise<ExamScoringResponse> {
  try {
    const response = await fetch("/api/score-exam", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answers }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: ExamScoringResponse = await response.json()
    return data
  } catch (error) {
    console.error("Error calling AI scoring API:", error)
    // Return fallback response
    return {
      results: answers.map((a) => ({
        question_id: a.question_id,
        similarity_score: 0,
        final_score: 0,
        max_score: a.max_score,
      })),
      total_score: 0,
      total_max_score: answers.reduce((sum, a) => sum + a.max_score, 0),
      status: "error",
      error: "Failed to connect to scoring service",
    }
  }
}
