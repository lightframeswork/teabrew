import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { TEA_LIBRARY } from '../data/teas'
import type { Tea } from '../types'
import { Icon } from '../components/Icon'
import { EmptyState } from '../components/ui'
import { TeaMark } from '../components/TeaRow'

/** Sucht über Name, Marke, Herkunft, Sorte, Merkmale und Beschreibung. */
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

export function SearchOverlay({
  onClose,
  onOpenTea,
  onOpenLibraryTea,
}: {
  onClose: () => void
  onOpenTea: (id: string) => void
  onOpenLibraryTea: (id: string) => void
}) {
  const collection = useStore((state) => state.collection)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const needle = query.trim().toLowerCase()

  const { mine, library } = useMemo(() => {
    if (!needle) return { mine: [], library: [] }
    const owned = new Set(collection.map((tea) => tea.id))
    return {
      mine: collection.filter((tea) => matches(tea, needle)),
      library: TEA_LIBRARY.filter((tea) => !owned.has(tea.id) && matches(tea, needle)).slice(0, 12),
    }
  }, [collection, needle])

  const hasResults = mine.length + library.length > 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tee suchen"
      className="anim-fade absolute inset-0 z-40 flex flex-col bg-canvas"
    >
      <div className="flex items-center gap-2 px-3 pb-2 pt-[calc(var(--safe-top)+10px)]">
        <div className="field flex flex-1 items-center gap-2.5 py-0 pl-3 pr-2">
          <Icon name="lupe" size={17} className="shrink-0 text-ink-3" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, Marke, Herkunft, Aroma"
            aria-label="Suchbegriff"
            enterKeyHint="search"
            className="h-11 min-w-0 flex-1 bg-transparent text-callout outline-none placeholder:text-ink-3"
          />
          {query && (
            <button
              type="button"
              aria-label="Eingabe löschen"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="pressable flex h-8 w-8 items-center justify-center rounded-full text-ink-3"
            >
              <Icon name="kreuz" size={15} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="pressable min-h-[44px] shrink-0 px-2 text-callout text-ink-2"
        >
          Fertig
        </button>
      </div>

      <div className="scroll-area flex-1">
        {!needle ? (
          <EmptyState
            icon="lupe"
            title="Wonach suchst du?"
            body="Chado durchsucht deine Sammlung und die gesamte Teebibliothek – auch nach Herkunft oder Aroma."
          />
        ) : !hasResults ? (
          <EmptyState
            icon="lupe"
            title="Nichts gefunden"
            body={`Zu „${query.trim()}“ gibt es keinen Treffer. Vielleicht hilft ein kürzerer Suchbegriff.`}
          />
        ) : (
          <div className="pb-10">
            {mine.length > 0 && (
              <Group
                title="In deiner Sammlung"
                teas={mine}
                onSelect={(id) => {
                  onClose()
                  onOpenTea(id)
                }}
              />
            )}
            {library.length > 0 && (
              <Group
                title="Aus der Teebibliothek"
                teas={library}
                onSelect={(id) => {
                  onClose()
                  onOpenLibraryTea(id)
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Group({
  title,
  teas,
  onSelect,
}: {
  title: string
  teas: Tea[]
  onSelect: (id: string) => void
}) {
  return (
    <section className="pt-3">
      <h2 className="px-gutter pb-1 text-footnote font-semibold text-ink-2">{title}</h2>
      <ul className="stagger px-3">
        {teas.map((tea, index) => (
          <li key={tea.id} style={{ '--i': index } as React.CSSProperties}>
            <button
              type="button"
              onClick={() => onSelect(tea.id)}
              className="pressable-subtle flex min-h-[60px] w-full items-center gap-3 rounded-lg px-2 text-left hover:bg-surface"
            >
              <TeaMark tea={tea} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-callout font-medium text-ink">{tea.name}</span>
                <span className="block truncate text-caption text-ink-2">
                  {tea.brand} · {tea.variety}
                </span>
              </span>
              <Icon name="weiter" size={16} className="shrink-0 text-ink-3" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
