"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth"
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore"
import { auth, db } from "@/firebase/config"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      setLoading(false)

      // Set cookie untuk middleware
      if (user) {
        user.getIdToken().then((token) => {
          document.cookie = `auth-token=${token}; path=/; max-age=3600`
        })

        // Auto-create user document jika belum ada
        try {
          const userDocRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userDocRef)

          if (!userDoc.exists()) {
            // Create user document
            await setDoc(userDocRef, {
              id: user.uid,
              name: user.displayName || user.email?.split("@")[0] || "User",
              email: user.email || "",
              role: "user",
              avatar: user.photoURL || null,
              bio: "",
              joinDate: Timestamp.now(),
              lastActive: Timestamp.now(),
            })
          } else {
            // Update lastActive
            await setDoc(
              userDocRef,
              { lastActive: Timestamp.now() },
              { merge: true }
            )
          }
        } catch (error) {
          console.error("Error creating/updating user document:", error)
        }
      } else {
        document.cookie = "auth-token=; path=/; max-age=0"
      }
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    await firebaseSignOut(auth)
    document.cookie = "auth-token=; path=/; max-age=0"
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

