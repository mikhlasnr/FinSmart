import { Timestamp } from "firebase/firestore"

// Type for Module
export interface Module {
  id: string
  title: string
  description: string
  content: string
  createdAt: Timestamp | Date
}

// Type for Exam
export interface Exam {
  id: string
  moduleId: string
  question: string
  keyAnswer: string
  maxScore: number
}

// Type for Event Category
export interface EventCategory {
  id: string
  name: string
  slug: string
}

// Type for Event
export interface Event {
  id: string
  title: string
  description: string
  categoryId: string
  startDate: Timestamp | Date
  endDate: Timestamp | Date
  registrationLink: string
}

// Type for User Profile
export interface UserProfile {
  id: string
  name: string
  email: string
  role: "user"
  avatar?: string
  bio?: string
  joinDate: Timestamp | Date
  lastActive?: Timestamp | Date
}

// Type for Exam Result Answer
export interface ExamResultAnswer {
  questionId: string
  question: string
  userAnswer: string
  keyAnswer: string
  maxScore: number
  similarityScore: number
  finalScore: number
}

// Type for Exam Result
export interface ExamResult {
  id: string
  userId: string
  userDisplayName: string
  userEmail: string
  userAvatar?: string
  moduleId: string
  moduleTitle: string
  submittedAt: Timestamp | Date
  totalScore: number
  answers: ExamResultAnswer[]
}

