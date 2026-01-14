"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, LogOut, User, Home, BookOpen, Calendar, History, X } from "lucide-react"

export function UserNavbar() {
  const { user, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDrawerVisible, setIsDrawerVisible] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false)
  }, [user?.photoURL])

  // Handle scroll behavior
  useEffect(() => {
    // Always show navbar when mobile menu is open
    if (mobileMenuOpen) {
      setIsVisible(true)
      return
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show navbar when at top of page
      if (currentScrollY < 10) {
        setIsVisible(true)
      } else {
        // Hide when scrolling down, show when scrolling up
        if (currentScrollY > lastScrollY) {
          setIsVisible(false) // Scrolling down
        } else {
          setIsVisible(true) // Scrolling up
        }
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY, mobileMenuOpen])

  // Handle drawer animation and visibility
  useEffect(() => {
    if (mobileMenuOpen) {
      // Open drawer: show immediately
      setIsDrawerVisible(true)
    } else {
      // Close drawer: wait for animation to complete before hiding
      const timer = setTimeout(() => {
        setIsDrawerVisible(false)
      }, 300) // Match transition duration (300ms)
      return () => clearTimeout(timer)
    }
  }, [mobileMenuOpen])

  // Handle body scroll lock when drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [mobileMenuOpen])

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    if (mobileMenuOpen) {
      document.addEventListener("keydown", handleEscape)
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [mobileMenuOpen])

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/modules", label: "Modules", icon: BookOpen },
    { href: "/exam-history", label: "Exam History", icon: History },
    { href: "/events", label: "Events", icon: Calendar },
  ]

  const handleSignOut = async () => {
    await signOut()
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

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] transition-transform duration-300 ${isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="shrink-0">
              <h1 className="text-lg sm:text-xl font-bold text-[hsl(var(--foreground))]">
                FinSmart
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${isActive
                    ? "border-[hsl(var(--primary))] text-[hsl(var(--foreground))]"
                    : "border-transparent text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border))] hover:text-[hsl(var(--foreground))]"
                    }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Desktop User Dropdown */}
            <div className="hidden md:block">
              <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      {user?.photoURL && !imageError ? (
                        <AvatarImage
                          src={user.photoURL}
                          alt={user?.displayName || "User"}
                          onError={() => setImageError(true)}
                        />
                      ) : null}
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline-block text-sm">
                      {user?.displayName || user?.email?.split("@")[0] || "User"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setUserMenuOpen(false)
                      router.push("/profile")
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setUserMenuOpen(false)
                      handleSignOut()
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer - Slide Down from Top (Notion Style) */}
      {isDrawerVisible && (
        <>
          {/* Backdrop Overlay */}
          <div
            className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ease-out ${mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            style={{ zIndex: 9998 }}
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel - Slides from top */}
          <div
            className={`fixed top-0 left-0 right-0 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] shadow-lg transition-all duration-300 ease-in-out will-change-transform ${mobileMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
              }`}
            style={{ zIndex: 9999 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col max-h-[85vh] overflow-hidden">
              {/* Header with Close Button */}
              <div className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] shrink-0">
                <h2 className="text-lg sm:text-xl font-bold text-[hsl(var(--foreground))]">
                  FinSmart
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Navigation Items - Scrollable */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4">
                <nav className="space-y-1">
                  {navItems.map((item, index) => {
                    const Icon = item.icon
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center px-4 py-3.5 rounded-lg text-base font-medium transition-all duration-150 ${isActive
                          ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-semibold"
                          : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] active:scale-[0.98]"
                          } ${mobileMenuOpen ? "menu-item-animate" : ""}`}
                        style={{
                          animationDelay: mobileMenuOpen ? `${index * 30}ms` : "0ms",
                        }}
                      >
                        <Icon className="mr-3 h-5 w-5 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>

              {/* User Section - Fixed at Bottom */}
              <div className="border-t border-[hsl(var(--border))] px-4 sm:px-6 py-4 space-y-2 bg-[hsl(var(--card))] shrink-0">
                {/* User Info Card */}
                <div className="flex items-center px-4 py-3 rounded-lg bg-[hsl(var(--accent))]/30">
                  <Avatar className="h-10 w-10 mr-3 shrink-0">
                    {user?.photoURL && !imageError ? (
                      <AvatarImage
                        src={user.photoURL}
                        alt={user?.displayName || "User"}
                        onError={() => setImageError(true)}
                      />
                    ) : null}
                    <AvatarFallback className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                      {getInitials(user?.displayName || user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-[hsl(var(--foreground))]">
                      {user?.displayName || "User"}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>

                {/* Profile Link */}
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] transition-colors active:scale-[0.98]"
                >
                  <User className="mr-3 h-5 w-5 shrink-0" />
                  <span>Profile</span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleSignOut()
                  }}
                  className="w-full flex items-center px-4 py-3 rounded-lg text-base font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] transition-colors active:scale-[0.98]"
                >
                  <LogOut className="mr-3 h-5 w-5 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  )
}

