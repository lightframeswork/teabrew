import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { category } from '../data/categories'
import type { CategoryId } from '../types'
import { ScreenHeader } from '../components/Shell'
import { EmptyState, IconButton, Segmented } from '../components/ui'
import { TeaRow } from '../components/TeaRow'

type Sort = 'name' | 'marke' | 'neu'

export function CategoryList({
  categoryId,
  onBack,
  onOpenTea,
}: {
  categoryId: CategoryId
  onBack: () => void
  onOpenTea: (id: string) => void
}) {
  const collection = useStore((state) => state.collection)
  const favorites = useStore((state) => state.favorites)
  const toggleFavorite = useStore((state) => state.toggleFavorite)
  const [sort, setSort] = useState<Sort>('name')

  const cat = category(categoryId)

  const teas = useMemo(() => {
    const list = collection.filter((tea) => tea.category === categoryId)
    const collator = new Intl.Collator('de-DE', { sensitivity: 'base' })
    if (sort === 'marke') {
      return [...list].sort(
        (a, b) => collator.compare(a.brand, b.brand) || collator.compare(a.name, b.name)
      )
    }
    if (sort === 'neu') {
      return [...list].sort((a, b) => (b.addedDate ?? '').localeCompare(a.addedDate ?? ''))
    }
    return [...list].sort((a, b) => collator.compare(a.name, b.name))
  }, [collection, categoryId, sort])

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title={cat.label} subtitle={`${teas.length} in deiner Sammlung`} onBack={onBack} />
      <div className="scroll-area flex-1">
        <p className="px-gutter pb-4 pt-1 text-pretty text-footnote text-ink-2">{cat.blurb}</p>

        {teas.length > 1 && (
          <div className="px-gutter pb-3">
            <Segmented<Sort>
              label="Sortierung"
              value={sort}
              onChange={setSort}
              options={[
                { value: 'name', label: 'A–Z' },
                { value: 'marke', label: 'Marke' },
                { value: 'neu', label: 'Neueste' },
              ]}
            />
          </div>
        )}

        {teas.length === 0 ? (
          <EmptyState
            icon="blatt"
            title={`Noch kein ${cat.label} dabei`}
            body="Sobald du einen Tee dieser Sorte hinzufügst, taucht er hier auf."
          />
        ) : (
          <ul className="stagger px-3 pb-8">
            {teas.map((tea, index) => (
              <TeaRow
                key={tea.id}
                tea={tea}
                index={index}
                onSelect={() => onOpenTea(tea.id)}
                trailing={
                  <IconButton
                    name="herz"
                    label={
                      favorites.includes(tea.id)
                        ? `${tea.name} aus den Favoriten entfernen`
                        : `${tea.name} zu den Favoriten`
                    }
                    active={favorites.includes(tea.id)}
                    size={18}
                    onClick={() => toggleFavorite(tea.id)}
                  />
                }
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
