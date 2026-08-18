import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../lib/cn'
import { Icon, type IconName } from './Icon'

/* ------------------------------------------------------------------ Button */

type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone
  icon?: IconName
  iconRight?: IconName
  block?: boolean
  loading?: boolean
}

const TONE: Record<ButtonTone, string> = {
  primary: 'bg-ink text-canvas hover:bg-ink/90 disabled:bg-ink/40',
  secondary: 'bg-surface text-ink border border-line hover:border-line-strong',
  ghost: 'text-ink-2 hover:text-ink',
  danger: 'bg-danger/10 text-danger border border-danger/25 hover:bg-danger/15',
}

export function Button({
  tone = 'primary',
  icon,
  iconRight,
  block,
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'pressable inline-flex min-h-[46px] items-center justify-center gap-2 rounded-lg px-5 text-callout font-medium',
        'disabled:cursor-not-allowed disabled:opacity-55',
        block && 'w-full',
        TONE[tone],
        className
      )}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon && <Icon name={icon} size={18} />
      )}
      {children}
      {iconRight && <Icon name={iconRight} size={18} />}
    </button>
  )
}

/* -------------------------------------------------------------- IconButton */

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  name: IconName
  label: string
  size?: number
  active?: boolean
}

export function IconButton({ name, label, size = 20, active, className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'pressable inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
        active ? 'text-accent' : 'text-ink-2 hover:text-ink',
        className
      )}
      {...rest}
    >
      <Icon name={name} size={size} filled={active && (name === 'herz' || name === 'stern')} />
    </button>
  )
}

/* --------------------------------------------------------------- Textfeld */

interface FieldProps {
  label: string
  hint?: string
  error?: string
  required?: boolean
  children: (props: { id: string; describedBy?: string; invalid?: true }) => ReactNode
}

export function Field({ label, hint, error, required, children }: FieldProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-footnote font-medium text-ink-2">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children({ id, describedBy, invalid: error ? true : undefined })}
      {error ? (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-caption text-danger">
          <Icon name="warnung" size={13} />
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-caption text-ink-3">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('field text-callout', className)} {...rest} />
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('field resize-none text-callout leading-relaxed', className)} {...rest} />
}

/* ------------------------------------------------------------- Segmentiert */

interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}

export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-lg bg-sunken p-1">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'pressable-subtle min-h-[36px] flex-1 rounded-[7px] px-2 text-footnote font-medium',
              selected ? 'bg-surface text-ink shadow-raise' : 'text-ink-2'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ Karten */

export function Card({
  children,
  className,
  as: As = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
}) {
  return (
    <As className={cn('rounded-lg border border-line bg-surface', className)}>{children}</As>
  )
}

/** Überschrift einer Abschnittsgruppe – klein, ruhig, ohne Versalien-Schrei. */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn('mb-2.5 text-footnote font-semibold text-ink-2', className)}>{children}</h2>
  )
}

/* ------------------------------------------------------------- Leerzustand */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center anim-rise">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sunken text-ink-3">
        <Icon name={icon} size={28} />
      </span>
      <p className="font-display text-title3 text-ink">{title}</p>
      <p className="mt-2 max-w-[30ch] text-pretty text-body text-ink-2">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------- Sheet */

export function Sheet({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-ink/35 anim-fade"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="anim-sheet relative max-h-[86%] overflow-hidden rounded-t-2xl border-t border-line bg-canvas shadow-sheet"
      >
        <div className="flex items-center justify-between gap-3 px-gutter pb-2 pt-3">
          <span className="absolute left-1/2 top-2 h-1 w-9 -translate-x-1/2 rounded-full bg-line-strong" />
          <h2 className="mt-3 font-display text-title3 text-ink">{title}</h2>
          <IconButton name="kreuz" label="Schließen" onClick={onClose} className="mt-3 -mr-2" />
        </div>
        <div className="scroll-area max-h-[calc(86vh-120px)] px-gutter pb-4">{children}</div>
        {footer && (
          <div className="border-t border-line px-gutter pb-[calc(var(--safe-bottom)+16px)] pt-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------- Bestätigung */

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-8">
      <div
        aria-hidden="true"
        onClick={onCancel}
        className="absolute inset-0 bg-ink/40 anim-fade"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="anim-pop relative w-full max-w-[19rem] rounded-xl border border-line bg-surface p-5 shadow-lift"
      >
        <h2 className="font-display text-title3 text-ink">{title}</h2>
        <p className="mt-2 text-pretty text-body text-ink-2">{body}</p>
        <div className="mt-5 flex gap-2">
          <Button tone="secondary" block onClick={onCancel}>
            Abbrechen
          </Button>
          <Button tone="danger" block onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------- Bewertung */

export function RatingInput({
  value,
  onChange,
  label = 'Bewertung',
}: {
  value: number
  onChange: (value: number) => void
  label?: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} von 5`}
            onClick={() => onChange(star === value ? 0 : star)}
            className={cn(
              'pressable flex h-11 w-11 items-center justify-center rounded-full',
              active ? 'text-heat' : 'text-line-strong'
            )}
          >
            <Icon name="stern" size={22} filled={active} />
          </button>
        )
      })}
    </div>
  )
}

export function RatingDots({ value }: { value: number }) {
  if (!value) return null
  return (
    <span className="flex items-center gap-0.5 text-heat" aria-label={`${value} von 5 Sternen`}>
      {Array.from({ length: value }, (_, index) => (
        <Icon key={index} name="stern" size={11} filled strokeWidth={0} />
      ))}
    </span>
  )
}

/* ------------------------------------------------------------- Zahlensteller */

export function Stepper({
  label,
  value,
  display,
  onDecrease,
  onIncrease,
  canDecrease = true,
  canIncrease = true,
}: {
  label: string
  value: number
  display: string
  onDecrease: () => void
  onIncrease: () => void
  canDecrease?: boolean
  canIncrease?: boolean
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label={`${label} verringern`}
        disabled={!canDecrease}
        onClick={onDecrease}
        className="pressable flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink disabled:opacity-35"
      >
        <Icon name="minus" size={16} />
      </button>
      <output className="tnum min-w-[4.5rem] text-center text-callout font-semibold text-ink" aria-label={label}>
        {display}
      </output>
      <button
        type="button"
        aria-label={`${label} erhöhen`}
        disabled={!canIncrease}
        onClick={onIncrease}
        className="pressable flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink disabled:opacity-35"
      >
        <Icon name="plus" size={16} />
      </button>
      <span className="sr-only">{value}</span>
    </div>
  )
}

/* ------------------------------------------------------------ Ausklappbar */

export function Disclosure({
  summary,
  children,
  defaultOpen = false,
}: {
  summary: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <div className="border-t border-line first:border-t-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className="pressable-subtle flex min-h-[52px] w-full items-center justify-between gap-3 text-left text-callout font-medium text-ink"
      >
        {summary}
        <Icon
          name="runter"
          size={18}
          className={cn(
            'shrink-0 text-ink-3 transition-transform duration-200 ease-out',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div id={id} className="anim-fade pb-4">
          {children}
        </div>
      )}
    </div>
  )
}
