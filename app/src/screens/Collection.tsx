import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { CATEGORIES } from '../data/categories'
import type { CategoryId, Tea } from '../types'
import { greeting } from '../lib/format'
import { Button, EmptyState, SectionLabel } from '../components/ui'
import { CategoryTile, TeaRow } from '../components/TeaRow'
import { Icon } from '../components/Icon'

export function Collection({
  onOpenSearch,
  onOpenCategory,
  onOpenTea,
  onOpenLibrary,
  onOpenTimer,
}: {
  onOpenSearch: () => void
  onOpenCategory: (category: CategoryId) => void
  onOpenTea: (id: string) => void
  onOpenLibrary: () => void
  onOpenTimer: () => void
}) {
  const collection = useStore((state) => state.collection)
  const favorites = useStore((state) => state.favorites)
  const journal = useStore((state) => state.journal)
  const userName = useStore((state) => state.settings.userName)

  const hello = greeting(new Date().getHours())

  const usedCategories = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        ...cat,
        count: collection.filter((tea) => tea.category === cat.id).length,
      })).filter((cat) => cat.count > 0),
    [collection]
  )

  const favoriteTeas = useMemo(
    () => collection.filter((tea) => favorites.includes(tea.id)),
    [collection, favorites]
  )

  /** Zuletzt getrunken schlägt zuletzt hinzugefügt – das ist der echte Wiedereinstieg. */
  const recentlyBrewed = useMemo(() => {
    const seen = new Set<string>()
    const result: Tea[] = []
    for (const entry of journal) {
      if (seen.has(entry.teaId)) continue
      const tea = collection.find((item) => item.id === entry.teaId)
      if (!tea) continue
      seen.add(entry.teaId)
      result.push(tea)
      if (result.length === 4) break
    }
    return result
  }, [journal, collection])

  const recentlyAdded = useMemo(
    () =>
      [...collection]
        .sort((a, b) => (b.addedDate ?? '').localeCompare(a.addedDate ?? ''))
        .slice(0, 6),
    [collection]
  )

  return (
    <div className="scroll-area h-full">
      <div className="px-gutter pb-3 pt-[calc(var(--safe-top)+20px)]">
        <h1 className="text-balance font-display text-display1 leading-[1.06] text-ink">
          {hello},
          <br />
          <span className="text-ink-2">{userName || 'schön, dass du da bist'}</span>
        </h1>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="pressable-subtle flex h-12 flex-1 items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 text-left"
          >
            <Icon name="lupe" size={18} className="shrink-0 text-ink-3" />
            <span className="text-callout text-ink-3">Tee suchen</span>
          </button>
          <button
            type="button"
            onClick={onOpenTimer}
            aria-label="Kurzzeit-Timer öffnen"
            className="pressable flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-ink-2"
          >
            <Icon name="sanduhr" size={19} />
          </button>
        </div>
      </div>

      {collection.length === 0 ? (
        <EmptyState
          icon="blatt"
          title="Deine Sammlung ist noch leer"
          body="Suche dir in der Teebibliothek etwas aus oder lege deinen eigenen Tee an. Danach findest du alles hier wieder."
          action={
            <Button icon="kompass" onClick={onOpenLibrary}>
              Zur Teebibliothek
            </Button>
          }
        />
      ) : (
        <>
          {favoriteTeas.length > 0 && (
            <section className="mt-2 px-gutter">
              <SectionLabel>Favoriten</SectionLabel>
              <ul className="stagger -mx-2">
                {favoriteTeas.map((tea, index) => (
                  <TeaRow
                    key={tea.id}
                    tea={tea}
                    index={index}
                    onSelect={() => onOpenTea(tea.id)}
                  />
                ))}
              </ul>
            </section>
          )}

          {recentlyBrewed.length > 0 && (
            <section className="mt-6 px-gutter">
              <SectionLabel>Zuletzt getrunken</SectionLabel>
              <ul className="stagger -mx-2">
                {recentlyBrewed.map((tea, index) => (
                  <TeaRow
                    key={tea.id}
                    tea={tea}
                    index={index}
                    onSelect={() => onOpenTea(tea.id)}
                  />
                ))}
              </ul>
            </section>
          )}

          <section className="mt-6 px-gutter">
            <SectionLabel>Sorten</SectionLabel>
            <div className="stagger grid grid-cols-2 gap-2">
              {usedCategories.map((cat, index) => (
                <CategoryTile
                  key={cat.id}
                  index={index}
                  label={cat.label}
                  count={cat.count}
                  categoryId={cat.id}
                  onSelect={() => onOpenCategory(cat.id)}
                />
              ))}
            </div>
          </section>

          <section className="mt-6 px-gutter">
            <SectionLabel>Zuletzt hinzugefügt</SectionLabel>
            <ul className="stagger -mx-2">
              {recentlyAdded.map((tea, index) => (
                <TeaRow key={tea.id} tea={tea} index={index} onSelect={() => onOpenTea(tea.id)} />
              ))}
            </ul>
          </section>

          <div className="px-gutter pb-8 pt-6">
            <Button tone="secondary" block icon="plus" onClick={onOpenLibrary}>
              Weitere Tees hinzufügen
            </Button>
          </div>
        </>
      )}

      <div className="h-4" />
    </div>
  )
}
