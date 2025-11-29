import * as React from "react"
import { cn } from "@/lib/utils"

interface DropdownMenuContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef?: React.MutableRefObject<HTMLElement | null>
}

const DropdownMenuContext = React.createContext<
  DropdownMenuContextValue | undefined
>(undefined)

const DropdownMenu = ({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) => {
  const triggerRef = React.useRef<HTMLElement | null>(null)

  return (
    <DropdownMenuContext.Provider value={{ open, onOpenChange, triggerRef }}>
      <div className="relative overflow-visible">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(DropdownMenuContext)
  const internalRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (context?.triggerRef && internalRef.current) {
      context.triggerRef.current = internalRef.current
    }
  }, [context?.triggerRef])

  if (!context)
    throw new Error("DropdownMenuTrigger must be used within DropdownMenu")

  const combinedRef = (node: HTMLButtonElement) => {
    internalRef.current = node
    if (typeof ref === "function") {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref: combinedRef,
      onClick: () => context.onOpenChange(!context.open),
      ...props,
    })
  }

  return (
    <button
      ref={combinedRef}
      type="button"
      className={className}
      onClick={() => context.onOpenChange(!context.open)}
      {...props}
    >
      {children}
    </button>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" | "center" }
>(({ className, children, align = "start", ...props }, ref) => {
  const context = React.useContext(DropdownMenuContext)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })

  React.useEffect(() => {
    if (context?.open && contentRef.current && context.triggerRef?.current) {
      const trigger = context.triggerRef.current
      const rect = trigger.getBoundingClientRect()
      const contentWidth = contentRef.current.offsetWidth || 120
      const contentHeight = contentRef.current.offsetHeight || 100

      let left = rect.left
      let top = rect.bottom + 4

      if (align === "end") {
        left = rect.right - contentWidth
      } else if (align === "center") {
        left = rect.left + (rect.width / 2) - (contentWidth / 2)
      }

      // Adjust if going off screen
      if (left + contentWidth > window.innerWidth) {
        left = window.innerWidth - contentWidth - 8
      }
      if (left < 8) {
        left = 8
      }
      if (top + contentHeight > window.innerHeight + window.scrollY) {
        top = rect.top - contentHeight - 4
      }

      setPosition({
        top: top + window.scrollY,
        left: left + window.scrollX,
      })
    }
  }, [context?.open, align, context?.triggerRef])

  if (!context)
    throw new Error("DropdownMenuContent must be used within DropdownMenu")

  if (!context.open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => context.onOpenChange(false)}
      />
      <div
        ref={(node) => {
          contentRef.current = node
          if (typeof ref === "function") {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        className={cn(
          "fixed z-[100] min-w-[8rem] overflow-visible rounded-md border bg-[hsl(var(--popover))] p-1 text-[hsl(var(--popover-foreground))] shadow-lg",
          className
        )}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(DropdownMenuContext)
  if (!context)
    throw new Error("DropdownMenuItem must be used within DropdownMenu")

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] focus:bg-[hsl(var(--accent))] focus:text-[hsl(var(--accent-foreground))] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onClick={() => context.onOpenChange(false)}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}

