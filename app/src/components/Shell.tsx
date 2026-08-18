import type { ReactNode } from 'react'
import { cn } from '../lib/cn'
import { Icon, type IconName } from './Icon'
import { useStore } from '../store/useStore'

/* ------------------------------------------------------------ Screen-Kopf */

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Zurück',
  action,
}: {
  title: string
  subtitle?: string
  onBack?: () => void
  backLabel?: string
  action?: ReactNode
}) {
  return (
    <header className="material material-top sticky top-0 z-20 px-gutter pb-2.5 pt-[calc(var(--safe-top)+10px)]">
      <div className="flex items-start gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="pressable -ml-2 flex h-11 items-center gap-1 rounded-full pl-2 pr-3 text-ink-2 hover:text-ink"
          >
            <Icon name="zurueck" size={20} />
            <span className="text-footnote">{backLabel}</span>
          </button>
        )}
        <div className="min-w-0 flex-1 pt-1.5">
          <h1 className="truncate font-display text-title2 text-ink">{title}</h1>
          {subtitle && <p className="truncate text-caption text-ink-2">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  )
}

/* --------------------------------------------------------------- Tableiste */

export type TabId = 'sammlung' | 'journal' | 'entdecken' | 'einstellungen'

const TABS: Array<{ id: TabId; label: string; icon: IconName }> = [
  { id: 'sammlung', label: 'Sammlung', icon: 'blatt' },
  { id: 'journal', label: 'Journal', icon: 'buch' },
  { id: 'entdecken', label: 'Entdecken', icon: 'kompass' },
  { id: 'einstellungen', label: 'Einstellungen', icon: 'regler' },
]

export function TabBar({ active, onSelect }: { active: TabId; onSelect: (tab: TabId) => void }) {
  return (
    <nav
      aria-label="Hauptbereiche"
      className="material relative z-30 shrink-0 pb-[calc(var(--safe-bottom)+10px)] pt-1.5"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-line" />
      <ul className="flex items-stretch justify-around px-1">
        {TABS.map((tab) => {
          const selected = tab.id === active
          return (
            <li key={tab.id} className="flex-1">
              <button
                type="button"
                onClick={() => onSelect(tab.id)}
                aria-current={selected ? 'page' : undefined}
                className={cn(
                  'pressable flex min-h-[52px] w-full flex-col items-center justify-center gap-1 rounded-lg',
                  selected ? 'text-accent' : 'text-ink-3 hover:text-ink-2'
                )}
              >
                <Icon name={tab.icon} size={21} strokeWidth={selected ? 1.9 : 1.6} />
                <span className={cn('text-micro tracking-normal', selected && 'font-semibold')}>
                  {tab.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/* ------------------------------------------------------------------ Toasts */

export function ToastStack() {
  const toasts = useStore((state) => state.toasts)
  const dismiss = useStore((state) => state.dismissToast)

  if (!toasts.length) return null

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--safe-bottom)+86px)] z-40 flex flex-col items-center gap-2 px-gutter"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismiss(toast.id)}
          className={cn(
            'anim-rise pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-lg border bg-surface px-4 py-3 text-left text-footnote shadow-lift',
            toast.tone === 'danger'
              ? 'border-danger/40 text-danger'
              : toast.tone === 'success'
                ? 'border-accent/40 text-accent'
                : 'border-line text-ink'
          )}
        >
          <Icon
            name={toast.tone === 'danger' ? 'warnung' : toast.tone === 'success' ? 'haken' : 'info'}
            size={16}
          />
          <span className="flex-1">{toast.message}</span>
        </button>
      ))}
    </div>
  )
}
