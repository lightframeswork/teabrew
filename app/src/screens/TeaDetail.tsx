import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { libraryTea } from '../data/teas'
import { category } from '../data/categories'
import { VESSELS } from '../data/vessels'
import { CAFFEINE_LABEL, type Tea } from '../types'
import { buildPlan, effectiveBrewing, resteepSummary } from '../lib/brewing'
import { celsius, duration, grams, ml } from '../lib/format'
import { ScreenHeader } from '../components/Shell'
import { Button, Card, ConfirmDialog, IconButton, SectionLabel, TextArea } from '../components/ui'
import { Icon, type IconName } from '../components/Icon'
import { categoryVar } from '../components/TeaRow'

export function TeaDetail({
  teaId,
  onBack,
  onBrew,
  onEdit,
}: {
  teaId: string
  onBack: () => void
  onBrew: (id: string) => void
  onEdit: (id: string) => void
}) {
  const collection = useStore((state) => state.collection)
  const favorites = useStore((state) => state.favorites)
  const toggleFavorite = useStore((state) => state.toggleFavorite)
  const updateNotes = useStore((state) => state.updateNotes)
  const removeTea = useStore((state) => state.removeTea)
  const setBrewingOverride = useStore((state) => state.setBrewingOverride)
  const addTea = useStore((state) => state.addTea)
  const toast = useStore((state) => state.toast)

  const owned = collection.find((item) => item.id === teaId)
  const tea: Tea | undefined = owned ?? libraryTea(teaId)

  const [notes, setNotes] = useState(owned?.personalNotes ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setNotes(owned?.personalNotes ?? '')
  }, [owned?.id, owned?.personalNotes])

  const plan = useMemo(() => {
    if (!tea) return null
    const brewing = effectiveBrewing(tea)
    return buildPlan(tea, {
      vesselId: tea.category === 'matcha' ? 'tasse' : brewing.vessel,
      sizeMl: brewing.vesselSizeMl,
    })
  }, [tea])

  if (!tea || !plan) {
    return (
      <div className="flex h-full flex-col">
        <ScreenHeader title="Tee nicht gefunden" onBack={onBack} />
        <p className="px-gutter pt-6 text-body text-ink-2">
          Dieser Tee ist nicht mehr in deiner Sammlung.
        </p>
      </div>
    )
  }

  const cat = category(tea.category)
  const isFavorite = favorites.includes(tea.id)
  const isMatcha = tea.category === 'matcha'
  const resteep = resteepSummary(plan)

  const saveNotes = () => {
    if (!owned) return
    if (notes.trim() === (owned.personalNotes ?? '').trim()) return
    updateNotes(tea.id, notes.trim())
    toast('success', 'Notiz gespeichert')
  }

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        title={tea.name}
        subtitle={tea.brand}
        onBack={onBack}
        action={
          owned && (
            <IconButton
              name="herz"
              label={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
              active={isFavorite}
              className="mt-1"
              onClick={() => toggleFavorite(tea.id)}
            />
          )
        }
      />

      <div className="scroll-area flex-1 px-gutter">
        <div className="anim-rise flex items-start gap-3 pb-5 pt-1">
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: `color-mix(in srgb, ${categoryVar(tea.category)} 13%, transparent)`,
              color: categoryVar(tea.category),
            }}
          >
            <Icon name={isMatcha ? 'besen' : 'blatt'} size={24} strokeWidth={1.7} />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-footnote text-ink-2">
              {cat.label} · {tea.variety}
            </p>
            <p className="text-caption text-ink-3">
              {tea.origin}
              {tea.originDetail && tea.originDetail !== tea.origin ? ` · ${tea.originDetail}` : ''}
            </p>
            {tea.nameOriginal && (
              <p className="mt-0.5 text-caption text-ink-3" lang="ja">
                {tea.nameOriginal}
              </p>
            )}
          </div>
        </div>

        {/* Die vier Zahlen, die beim Aufgießen zählen. */}
        <Card className="anim-rise grid grid-cols-2 divide-x divide-y divide-line overflow-hidden">
          <Metric icon="thermometer" label="Temperatur" value={celsius(plan.temperatureC)} />
          <Metric icon="waage" label="Teemenge" value={grams(plan.teaGrams)} />
          <Metric icon="tropfen" label="Wasser" value={ml(plan.waterMl)} />
          <Metric
            icon="sanduhr"
            label="Ziehzeit"
            value={isMatcha ? '—' : duration(plan.steepSeconds)}
          />
        </Card>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-ink-3">
          <span className="inline-flex items-center gap-1">
            <Icon name="kanne" size={13} />
            {isMatcha ? 'Chawan' : VESSELS[effectiveBrewing(tea).vessel].label}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="info" size={13} />
            {CAFFEINE_LABEL[tea.caffeine]}
          </span>
        </div>

        {tea.brewingOverride && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-sunken px-3 py-2">
            <span className="flex items-center gap-1.5 text-caption text-ink-2">
              <Icon name="stift" size={13} />
              Deine Einstellung, nicht die Empfehlung
            </span>
            <button
              type="button"
              onClick={() => {
                setBrewingOverride(tea.id, null)
                toast('info', 'Zurück auf die Empfehlung')
              }}
              className="pressable-subtle shrink-0 text-caption font-medium text-accent"
            >
              Zurücksetzen
            </button>
          </div>
        )}

        {resteep && (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-accent/8 px-3 py-2.5 text-footnote text-accent">
            <Icon name="wiederholen" size={15} className="mt-0.5 shrink-0" />
            <span className="text-pretty">{resteep}</span>
          </p>
        )}

        <section className="mt-7">
          <SectionLabel>Über diesen Tee</SectionLabel>
          <p className="text-pretty text-body leading-relaxed text-ink-2">{tea.description}</p>
          {tea.tags.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {tea.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-sunken px-2.5 py-1 text-caption text-ink-2"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-7">
          <SectionLabel>Ablauf</SectionLabel>
          <ol className="space-y-3">
            {plan.steps.map((step, index) => (
              <li key={`${step.kind}-${index}`} className="flex gap-3">
                <span className="tnum mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunken text-caption font-semibold text-ink-2">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-footnote font-medium text-ink">
                    {step.title}
                    {step.seconds !== null && (
                      <span className="tnum ml-1.5 font-normal text-ink-3">
                        {duration(step.seconds)}
                      </span>
                    )}
                  </span>
                  <span className="block text-pretty text-footnote text-ink-2">
                    {step.description}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {owned ? (
          <section className="mt-7">
            <SectionLabel>Deine Notizen</SectionLabel>
            <TextArea
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              onBlur={saveNotes}
              placeholder="Wie schmeckt er dir? Was würdest du beim nächsten Mal anders machen?"
              aria-label="Deine Notizen zu diesem Tee"
            />
          </section>
        ) : (
          <div className="mt-7">
            <Button
              block
              icon="plus"
              onClick={() => {
                if (addTea(tea)) toast('success', `${tea.name} in die Sammlung übernommen`)
                else toast('info', `${tea.name} ist schon in deiner Sammlung`)
              }}
            >
              In die Sammlung übernehmen
            </Button>
          </div>
        )}

        {owned && (
          <div className="mt-7 space-y-1 border-t border-line pt-4">
            {tea.custom && (
              <button
                type="button"
                onClick={() => onEdit(tea.id)}
                className="pressable-subtle flex min-h-[44px] items-center gap-2 text-footnote text-ink-2"
              >
                <Icon name="stift" size={16} />
                Diesen Tee bearbeiten
              </button>
            )}
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="pressable-subtle flex min-h-[44px] items-center gap-2 text-footnote text-danger"
            >
              <Icon name="papierkorb" size={16} />
              Aus der Sammlung entfernen
            </button>
          </div>
        )}

        <div className="h-32" />
      </div>

      {/* Der Hauptweg liegt dauerhaft am Daumen, nicht am Ende des Scrollens. */}
      <div className="material material-bottom absolute inset-x-0 bottom-0 z-20 px-gutter pb-[calc(var(--safe-bottom)+14px)] pt-3">
        <Button block icon="kessel" onClick={() => onBrew(tea.id)}>
          Zubereitung starten
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Tee entfernen?"
        body={`${tea.name} verschwindet aus deiner Sammlung. Deine Journaleinträge bleiben erhalten.`}
        confirmLabel="Entfernen"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          removeTea(tea.id)
          setConfirmDelete(false)
          toast('info', `${tea.name} entfernt`)
          onBack()
        }}
      />
    </div>
  )
}

function Metric({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="-mb-px -mr-px px-3.5 py-3">
      <span className="flex items-center gap-1.5 text-caption text-ink-3">
        <Icon name={icon} size={13} />
        {label}
      </span>
      <span className="tnum mt-1 block text-title3 font-semibold text-ink">{value}</span>
    </div>
  )
}
