import type { CategoryId, Tea } from '../types'
import { effectiveBrewing } from '../lib/brewing'
import { celsius, duration, grams } from '../lib/format'
import { cn } from '../lib/cn'
import { Icon } from './Icon'

/** Sortenfarbe als CSS-Variable, damit sie im dunklen Modus mitwechselt. */
export function categoryVar(id: CategoryId): string {
  return `var(--cat-${id})`
}

/** Matcha wird aufgeschlagen, Kräuter sind kein Blatt – das zeigt das Symbol. */
export function markIcon(id: CategoryId) {
  if (id === 'matcha') return 'besen' as const
  if (id === 'anderer') return 'tropfen' as const
  return 'blatt' as const
}

/**
 * Sortenmarke statt Bild.
 *
 * Die Bibliothek hat keine Fotos. Statt Platzhalterbilder zu erfinden, steht
 * hier eine gefärbte Blattmarke in der Sortenfarbe – das trägt Information
 * (welche Sorte) und braucht keine Assets.
 */
export function TeaMark({ tea, size = 40 }: { tea: Tea; size?: number }) {
  const hue = categoryVar(tea.category)
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-[10px]"
      style={{
        width: size,
        height: size,
        background: `color-mix(in srgb, ${hue} 13%, transparent)`,
        color: hue,
      }}
    >
      <Icon name={markIcon(tea.category)} size={Math.round(size * 0.5)} strokeWidth={1.7} />
    </span>
  )
}

export function TeaRow({
  tea,
  onSelect,
  trailing,
  index = 0,
  showBrewHint = true,
}: {
  tea: Tea
  onSelect: () => void
  trailing?: React.ReactNode
  index?: number
  showBrewHint?: boolean
}) {
  const brewing = effectiveBrewing(tea)
  return (
    <li style={{ '--i': index } as React.CSSProperties}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onSelect}
          className="pressable-subtle flex min-h-[64px] flex-1 items-center gap-3 rounded-lg px-2 text-left hover:bg-surface"
        >
          <TeaMark tea={tea} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-callout font-medium text-ink">{tea.name}</span>
            <span className="mt-0.5 block truncate text-caption text-ink-2">
              {tea.brand}
              {showBrewHint && (
                <>
                  {' · '}
                  <span className="tnum">
                    {tea.category === 'matcha'
                      ? `${grams(brewing.teaGrams)} · ${celsius(brewing.temperatureC)}`
                      : `${celsius(brewing.temperatureC)} · ${duration(brewing.steepSeconds)} · ${grams(brewing.teaGrams)}`}
                  </span>
                </>
              )}
            </span>
          </span>
        </button>
        {trailing}
      </div>
    </li>
  )
}

export function CategoryTile({
  label,
  count,
  categoryId,
  onSelect,
  index = 0,
}: {
  label: string
  count: number
  categoryId: CategoryId
  onSelect: () => void
  index?: number
}) {
  const hue = categoryVar(categoryId)
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ '--i': index } as React.CSSProperties}
      className={cn(
        'pressable-subtle flex min-h-[72px] flex-col justify-between rounded-lg border border-line bg-surface p-3 text-left'
      )}
    >
      <span
        aria-hidden
        className="flex h-7 w-7 items-center justify-center rounded-lg"
        style={{ background: `color-mix(in srgb, ${hue} 14%, transparent)`, color: hue }}
      >
        <Icon name={markIcon(categoryId)} size={15} strokeWidth={1.8} />
      </span>
      <span>
        <span className="block text-footnote font-medium text-ink">{label}</span>
        <span className="tnum block text-caption text-ink-3">
          {count} {count === 1 ? 'Tee' : 'Tees'}
        </span>
      </span>
    </button>
  )
}
