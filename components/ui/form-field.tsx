import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "./label"
import { Input } from "./input"

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className={error ? "text-red-600" : ""}>
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </Label>
      {children}
      {error && (
        <p className="text-sm font-medium text-red-600" style={{ color: 'rgb(220, 38, 38)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        className={cn(
          error ? "border-red-500 focus-visible:ring-red-500" : "",
          className
        )}
        {...props}
      />
    )
  }
)
FormInput.displayName = "FormInput"

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  FormTextareaProps
>(({ className, error, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[100px] w-full rounded-md border bg-[hsl(var(--background))] px-3 py-2 text-sm ring-offset-background placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        error
          ? "border-red-500 focus-visible:ring-red-500"
          : "border-[hsl(var(--input))] focus-visible:ring-[hsl(var(--ring))]",
        className
      )}
      {...props}
    />
  )
})
FormTextarea.displayName = "FormTextarea"

