import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { Button } from "./button"

interface SheetContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextValue | undefined>(
  undefined
)

const Sheet = ({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])

  // Handle ESC key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }
    if (open) {
      document.addEventListener("keydown", handleEscape)
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      <div className="fixed inset-0 z-50">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
        {children}
      </div>
    </SheetContext.Provider>
  )
}

const SheetContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    side?: "top" | "right" | "bottom" | "left"
  }
>(({ className, children, side = "right", ...props }, ref) => {
  const context = React.useContext(SheetContext)
  if (!context)
    throw new Error("SheetContent must be used within Sheet")

  const sideClasses = {
    top: "inset-x-0 top-0 border-b rounded-b-lg",
    right: "inset-y-0 right-0 h-full w-full sm:w-[400px] border-l",
    bottom: "inset-x-0 bottom-0 border-t rounded-t-lg",
    left: "inset-y-0 left-0 h-full w-full sm:w-[400px] border-r",
  }

  const transformClasses = {
    top: context.open ? "translate-y-0" : "-translate-y-full",
    right: context.open ? "translate-x-0" : "translate-x-full",
    bottom: context.open ? "translate-y-0" : "translate-y-full",
    left: context.open ? "translate-x-0" : "-translate-x-full",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "fixed z-50 bg-[hsl(var(--background))] shadow-2xl transition-transform duration-300 ease-out overflow-y-auto will-change-transform",
        sideClasses[side],
        transformClasses[side],
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  )
})
SheetContent.displayName = "SheetContent"

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left mb-4",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold text-[hsl(var(--foreground))]", className)}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[hsl(var(--muted-foreground))]", className)}
    {...props}
  />
))
SheetDescription.displayName = "SheetDescription"

const SheetClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const context = React.useContext(SheetContext)
  if (!context)
    throw new Error("SheetClose must be used within Sheet")

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("absolute right-4 top-4", className)}
      onClick={() => context.onOpenChange(false)}
      {...props}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </Button>
  )
})
SheetClose.displayName = "SheetClose"

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose }

