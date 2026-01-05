"use client"

import { UserGuard } from "@/components/user-guard"
import { UserNavbar } from "@/components/user-navbar"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserGuard>
      <div className="min-h-screen bg-[hsl(var(--background))]">
        <UserNavbar />
        <main className="max-w-7xl mx-auto pt-20 pb-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </UserGuard>
  )
}

