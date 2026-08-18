import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { TEA_LIBRARY } from '../data/teas'
import { CATEGORIES } from '../data/categories'
import type { CategoryId, Tea } from '../types'
import { celsius, duration, grams } from '../lib/format'
import { cn } from '../lib/cn'
import { Button, EmptyState } from '../components/ui'
import { Icon } from '../components/Icon'
import { TeaMark } from '../components/TeaRow'

function matches(tea: Tea, needle: string): boolean {
  const haystack = [
    tea.name,
    tea.nameOriginal ?? '',
    tea.brand,
    tea.origin,
    tea.originDetail,
    tea.variety,
    tea.tradition,
    tea.description,
    tea.tags.join(' '),
  ]
    .join(' ')
    .toLowerCase()
  return needle
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word))
}

export function Library({
  onOpenTea,
  onCreateOwn,
}: {
  onOpenTea: (id: string) => void
  onCreateOwn: () => void
}) {
  const collection = useStore((state) => state.collection)
  const addTea = useStore((state) => state.addTea)
  const toast = useStore((state) => state.toast)

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<CategoryId | 'alle'>('alle')

  const owned = useMemo(() => new Set(collection.map((tea) => tea.id)), [collection])

  const available = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return TEA_LIBRARY.filter(
      (tea) =>
        (filter === 'alle' || tea.category === filter) && (!needle || matches(tea, needle))
    )
  }, [query, filter])

  const usedCategories = useMemo(
    () => CATEGORIES.filter((cat) => TEA_LIBRARY.some((tea) => tea.category === cat.id)),
    []
  )

  return (
    <div className="flex h-full flex-col">
      <header className="px-gutter pb-3 pt-[calc(var(--safe-top)+20px)]">
        <h1 className="font-display text-display1 text-ink">Entdecken</h1>
        <p className="mt-1 text-body text-ink-2">
          {TEA_LIBRARY.length} Tees mit hinterlegter Zubereitung.
        </p>

        <div className="field mt-4 flex items-center gap-2.5 py-0 pl-3 pr-2">
          <Icon name="lupe" size={17} className="shrink-0 text-ink-3" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, Marke, Herkunft, Aroma"
            aria-label="Teebibliothek durchsuchen"
            className="h-11 min-w-0 flex-1 bg-transparent text-callout outline-none placeholder:text-ink-3"
          />
          {query && (
            <button
              type="button"
              aria-label="Eingabe löschen"
              onClick={() => setQuery('')}
              className="pressable flex h-8 w-8 items-center justify-center rounded-full text-ink-3"
            >
              <Icon name="kreuz" size={15} />
            </button>
          )}
        </div>
      </header>

      <div
        className="scroll-area shrink-0 overflow-x-auto pb-2"
        role="radiogroup"
        aria-label="Nach Sorte filtern"
      >
        <div className="flex gap-1.5 px-gutter pr-8">
          <Chip label="Alle" selected={filter === 'alle'} onClick={() => setFilter('alle')} />
          {usedCategories.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.label}
              selected={filter === cat.id}
              onClick={() => setFilter(cat.id)}
            />
          ))}
        </div>
      </div>

      <div className="scroll-area flex-1">
        {available.length === 0 ? (
          <EmptyState
            icon="lupe"
            title="Kein Treffer"
            body="Vielleicht heißt der Tee anders – oder du legst ihn dir selbst an."
            action={
              <Button tone="secondary" icon="plus" onClick={onCreateOwn}>
                Eigenen Tee anlegen
              </Button>
            }
          />
        ) : (
          <ul className="stagger px-3 pt-1">
            {available.map((tea, index) => {
              const isOwned = owned.has(tea.id)
              return (
                <li
                  key={tea.id}
                  style={{ '--i': Math.min(index, 12) } as React.CSSProperties}
                  className="flex items-center gap-1"
                >
                  <button
                    type="button"
                    onClick={() => onOpenTea(tea.id)}
                    className="pressable-subtle flex min-h-[68px] flex-1 items-center gap-3 rounded-lg px-2 text-left hover:bg-surface"
                  >
                    <TeaMark tea={tea} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-callout font-medium text-ink">
                        {tea.name}
                      </span>
                      <span className="block truncate text-caption text-ink-2">
                        {tea.brand} · {tea.origin}
                      </span>
                      <span className="tnum mt-0.5 block truncate text-caption text-ink-3">
                        {tea.category === 'matcha'
                          ? `${grams(tea.brewing.teaGrams)} · ${celsius(tea.brewing.temperatureC)}`
                          : `${celsius(tea.brewing.temperatureC)} · ${duration(tea.brewing.steepSeconds)} · ${grams(tea.brewing.teaGrams)}`}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={isOwned}
                    aria-label={
                      isOwned
                        ? `${tea.name} ist bereits in deiner Sammlung`
                        : `${tea.name} zur Sammlung hinzufügen`
                    }
                    onClick={() => {
                      if (addTea(tea)) toast('success', `${tea.name} hinzugefügt`)
                    }}
                    className={cn(
                      'pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
                      isOwned
                        ? 'border-transparent text-accent'
                        : 'border-line text-ink-2 hover:border-line-strong hover:text-ink'
                    )}
                  >
                    <Icon name={isOwned ? 'haken' : 'plus'} size={17} strokeWidth={2} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="px-gutter pb-10 pt-6">
          <Button tone="secondary" block icon="stift" onClick={onCreateOwn}>
            Eigenen Tee anlegen
          </Button>
          <p className="mt-2 text-center text-caption text-ink-3">
            Für alles, was nicht in der Bibliothek steht.
          </p>
        </div>
      </div>
    </div>
  )
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'pressable-subtle min-h-[36px] shrink-0 rounded-full border px-3.5 text-footnote',
        selected
          ? 'border-ink bg-ink font-medium text-canvas'
          : 'border-line bg-surface text-ink-2'
      )}
    >
      {label}
    </button>
  )
}
