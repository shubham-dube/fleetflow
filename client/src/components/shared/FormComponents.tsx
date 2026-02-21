import { cn } from '@/lib/utils'
import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'

// ─── Form Field Wrapper ───────────────────────────────────────────────────────
interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  hint?: string
  className?: string
  children: React.ReactNode
}

export function FormField({ label, error, required, hint, className, children }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="block text-xs font-body font-medium text-text-secondary">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, prefix, suffix, ...props },
  ref,
) {
  if (prefix || suffix) {
    return (
      <div
        className={cn(
          'flex items-center bg-bg-surface border rounded-md overflow-hidden',
          'focus-within:ring-1 focus-within:ring-cyan-500/50 focus-within:border-cyan-500/50',
          error ? 'border-red-500/50' : 'border-bg-border',
          'transition-colors duration-150',
        )}
      >
        {prefix && (
          <span className="px-3 text-text-muted text-sm bg-bg-elevated border-r border-bg-border h-full flex items-center">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'flex-1 bg-transparent px-3 py-2 text-sm text-text-primary placeholder-text-muted',
            'focus:outline-none',
            'font-body',
            className,
          )}
          {...props}
        />
        {suffix && (
          <span className="px-3 text-text-muted text-sm">{suffix}</span>
        )}
      </div>
    )
  }

  return (
    <input
      ref={ref}
      className={cn(
        'input-base',
        error && 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50',
        className,
      )}
      {...props}
    />
  )
})

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, error, options, placeholder, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'input-base appearance-none cursor-pointer',
        error && 'border-red-500/50',
        className,
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-bg-elevated">
          {opt.label}
        </option>
      ))}
    </select>
  )
})

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, error, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'input-base resize-none',
        error && 'border-red-500/50',
        className,
      )}
      rows={3}
      {...props}
    />
  )
})

// ─── Checkbox ─────────────────────────────────────────────────────────────────
interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className={cn('flex items-center gap-2 cursor-pointer text-sm font-body text-text-secondary', className)}>
      <input
        type="checkbox"
        className="size-3.5 rounded border-bg-border bg-bg-surface accent-cyan-500"
        {...props}
      />
      {label}
    </label>
  )
}

// ─── Form row (multi-column) ──────────────────────────────────────────────────
export function FormRow({ children, cols = 2, className }: { children: React.ReactNode; cols?: number; className?: string }) {
  return (
    <div
      className={cn(
        'grid gap-4',
        cols === 2 && 'grid-cols-1 sm:grid-cols-2',
        cols === 3 && 'grid-cols-1 sm:grid-cols-3',
        className,
      )}
    >
      {children}
    </div>
  )
}

// ─── Form Section ─────────────────────────────────────────────────────────────
export function FormSection({
  title,
  children,
  className,
}: {
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <div className="flex items-center gap-3">
          <p className="label-base">{title}</p>
          <div className="flex-1 border-t border-bg-border" />
        </div>
      )}
      {children}
    </div>
  )
}