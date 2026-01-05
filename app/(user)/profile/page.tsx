"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore"
import { db } from "@/firebase/config"
import { useAuth } from "@/lib/auth-context"
import { UserProfile } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FormField, FormInput, FormTextarea } from "@/components/ui/form-field"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/toast"
import { Loader2, Award, FileText, BookOpen } from "lucide-react"
import { format } from "date-fns"

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  bio: z.string().max(500, "Bio is too long").optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState({
    modulesCompleted: 0,
    averageScore: 0,
    totalExams: 0,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchStats()
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const userDocRef = doc(db, "users", user.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile
        setProfile(data)
        reset({
          name: data.name,
          bio: data.bio || "",
        })
      } else {
        // Create default profile
        const defaultProfile: UserProfile = {
          id: user.uid,
          name: user.displayName || user.email?.split("@")[0] || "User",
          email: user.email || "",
          role: "user",
          avatar: user.photoURL || undefined,
          bio: "",
          joinDate: Timestamp.now(),
        }
        setProfile(defaultProfile)
        reset({
          name: defaultProfile.name,
          bio: defaultProfile.bio || "",
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      addToast({
        title: "Error",
        description: "Failed to load profile",
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!user) return

    try {
      const { collection, query, where, getDocs } = await import("firebase/firestore")
      const resultsRef = collection(db, "exam_results")
      const q = query(resultsRef, where("userId", "==", user.uid))
      const snapshot = await getDocs(q)

      const results: any[] = []
      snapshot.forEach((doc) => {
        results.push(doc.data())
      })

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
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return

    try {
      const userDocRef = doc(db, "users", user.uid)
      await setDoc(
        userDocRef,
        {
          name: data.name,
          bio: data.bio || "",
          lastActive: Timestamp.now(),
        },
        { merge: true }
      )

      addToast({
        title: "Success",
        description: "Profile updated successfully",
        variant: "success",
      })

      // Update local state
      if (profile) {
        setProfile({
          ...profile,
          name: data.name,
          bio: data.bio || "",
        })
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      addToast({
        title: "Error",
        description: "Failed to update profile",
        variant: "error",
      })
    }
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center mb-6">
              <Skeleton className="h-32 w-32 rounded-full mb-4" />
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">Profile not found</h3>
          </CardContent>
        </Card>
      </div>
    )
  }

  const joinDate = profile.joinDate instanceof Date
    ? profile.joinDate
    : (profile.joinDate as any)?.toDate?.() || new Date()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Manage your profile information
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <Avatar className="h-32 w-32 mb-4">
                    <AvatarImage src={user?.photoURL || profile.avatar || undefined} alt={profile.name} />
                    <AvatarFallback className="text-2xl">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold">{profile.name}</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {profile.email}
                  </p>
                </div>

                <FormField label="Display Name" error={errors.name?.message} required>
                  <FormInput
                    {...register("name")}
                    placeholder="Your name"
                    error={errors.name?.message}
                  />
                </FormField>

                <FormField label="Email" error={undefined}>
                  <FormInput
                    value={profile.email}
                    disabled
                    className="bg-[hsl(var(--muted))]"
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    Email cannot be changed
                  </p>
                </FormField>

                <FormField label="Bio" error={errors.bio?.message}>
                  <FormTextarea
                    {...register("bio")}
                    placeholder="Tell us about yourself..."
                    className="min-h-[100px]"
                    error={errors.bio?.message}
                  />
                </FormField>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => reset()}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Join Date</p>
                <p className="font-medium">{format(joinDate, "dd MMM yyyy")}</p>
              </div>
              <div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Role</p>
                <p className="font-medium capitalize">{profile.role}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                  <span className="text-sm">Modules Completed</span>
                </div>
                <span className="font-semibold">{stats.modulesCompleted}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                  <span className="text-sm">Average Score</span>
                </div>
                <span className="font-semibold">{stats.averageScore}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                  <span className="text-sm">Total Exams</span>
                </div>
                <span className="font-semibold">{stats.totalExams}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

