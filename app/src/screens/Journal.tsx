import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import type { JournalEntry } from '../types'
import { formatDayLabel, formatTime, infusionLabel } from '../lib/format'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  RatingDots,
  RatingInput,
  Segmented,
  Sheet,
  TextArea,
  TextInput,
} from '../components/ui'
import { Icon } from '../components/Icon'

type Range = 'alle' | 'woche' | 'monat'

export function Journal({
  onOpenLibrary,
  onOpenTea,
}: {
  onOpenLibrary: () => void
  onOpenTea: (id: string) => void
}) {
  const journal = useStore((state) => state.journal)
  const collection = useStore((state) => state.collection)
  const addEntry = useStore((state) => state.addJournalEntry)
  const updateEntry = useStore((state) => state.updateJournalEntry)
  const removeEntry = useStore((state) => state.removeJournalEntry)
  const toast = useStore((state) => state.toast)

  const [range, setRange] = useState<Range>('alle')
  const [composerOpen, setComposerOpen] = useState(false)
  const [editing, setEditing] = useState<JournalEntry | null>(null)
  const [pendingDelete, setPendingDelete] = useState<JournalEntry | null>(null)

  const ownedIds = useMemo(() => new Set(collection.map((t) => t.id)), [collection])

  const entries = useMemo(() => {
    if (range === 'alle') return journal
    const days = range === 'woche' ? 7 : 31
    const cutoff = Date.now() - days * 86_400_000
    return journal.filter((entry) => new Date(entry.date).getTime() >= cutoff)
  }, [journal, range])

  const grouped = useMemo(() => {
    const map = new Map<string, JournalEntry[]>()
    for (const entry of entries) {
      const key = formatDayLabel(entry.date)
      const list = map.get(key)
      if (list) list.push(entry)
      else map.set(key, [entry])
    }
    return [...map.entries()]
  }, [entries])

  const stats = useMemo(() => {
    const cups = journal.reduce((sum, entry) => sum + Math.max(1, entry.infusions), 0)
    const teas = new Set(journal.map((entry) => entry.teaId || entry.teaName)).size
    return { sessions: journal.length, cups, teas }
  }, [journal])

  return (
    <div className="flex h-full flex-col">
      <header className="px-gutter pb-3 pt-[calc(var(--safe-top)+20px)]">
        <h1 className="font-display text-display1 text-ink">Journal</h1>
        <p className="mt-1 text-body text-ink-2">Was du getrunken hast – und wie es war.</p>
      </header>

      <div className="scroll-area flex-1">
        {journal.length > 0 && (
          <>
            <div className="mx-gutter grid grid-cols-3 gap-2 rounded-lg border border-line bg-surface p-3">
              <Stat value={stats.sessions} label={stats.sessions === 1 ? 'Sitzung' : 'Sitzungen'} />
              <Stat value={stats.cups} label={stats.cups === 1 ? 'Aufguss' : 'Aufgüsse'} />
              <Stat value={stats.teas} label={stats.teas === 1 ? 'Tee' : 'Tees'} />
            </div>

            <div className="px-gutter pb-1 pt-4">
              <Segmented<Range>
                label="Zeitraum"
                value={range}
                onChange={setRange}
                options={[
                  { value: 'alle', label: 'Alle' },
                  { value: 'woche', label: '7 Tage' },
                  { value: 'monat', label: '30 Tage' },
                ]}
              />
            </div>
          </>
        )}

        {journal.length === 0 ? (
          <EmptyState
            icon="buch"
            title="Noch nichts notiert"
            body="Nach jeder Zubereitung kannst du festhalten, wie der Tee war. Mit der Zeit entsteht daraus eine Erinnerung an deine Tassen."
            action={
              collection.length === 0 ? (
                <Button icon="kompass" onClick={onOpenLibrary}>
                  Ersten Tee hinzufügen
                </Button>
              ) : (
                <Button icon="stift" onClick={() => setComposerOpen(true)}>
                  Eintrag schreiben
                </Button>
              )
            }
          />
        ) : entries.length === 0 ? (
          <EmptyState
            icon="buch"
            title="In diesem Zeitraum nichts"
            body="Wähle einen längeren Zeitraum, um ältere Einträge zu sehen."
          />
        ) : (
          <div className="px-gutter pt-4">
            {grouped.map(([day, items]) => (
              <section key={day} className="mb-6">
                <h2 className="mb-2 text-footnote font-semibold text-ink-2">{day}</h2>
                <ul className="stagger space-y-2">
                  {items.map((entry, index) => (
                    <li
                      key={entry.id}
                      style={{ '--i': index } as React.CSSProperties}
                      className="rounded-lg border border-line bg-surface"
                    >
                      {/* Der Eintrag führt zurück zum Tee – vorher war er eine Sackgasse. */}
                      <button
                        type="button"
                        disabled={!ownedIds.has(entry.teaId)}
                        onClick={() => onOpenTea(entry.teaId)}
                        className="pressable-subtle w-full rounded-t-lg p-3.5 text-left disabled:cursor-default"
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block truncate text-callout font-medium text-ink">
                              {entry.teaName}
                            </span>
                            <span className="block truncate text-caption text-ink-2">
                              {entry.teaBrand}
                              {entry.method ? ` · ${entry.method}` : ''}
                            </span>
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            <span className="tnum text-caption text-ink-3">
                              {formatTime(entry.date)}
                            </span>
                            <RatingDots value={entry.rating} />
                          </span>
                        </span>
                        {entry.notes && (
                          <span className="mt-2 block text-pretty text-footnote leading-relaxed text-ink-2">
                            {entry.notes}
                          </span>
                        )}
                      </button>

                      <div className="flex items-center justify-between gap-2 px-3.5 pb-2.5">
                        <span className="tnum text-caption text-ink-3">
                          {infusionLabel(Math.max(1, entry.infusions))}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditing(entry)}
                            className="pressable-subtle flex h-9 items-center gap-1.5 rounded-full px-2 text-caption text-ink-3 hover:text-ink"
                          >
                            <Icon name="stift" size={14} />
                            Bearbeiten
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(entry)}
                            className="pressable-subtle -mr-2 flex h-9 items-center gap-1.5 rounded-full px-2 text-caption text-ink-3 hover:text-danger"
                          >
                            <Icon name="papierkorb" size={14} />
                            Löschen
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <div className="h-28" />
      </div>

      {journal.length > 0 && (
        <div className="material material-bottom absolute inset-x-0 bottom-0 z-20 px-gutter pb-[calc(var(--safe-bottom)+14px)] pt-3">
          <Button block icon="stift" onClick={() => setComposerOpen(true)}>
            Eintrag schreiben
          </Button>
        </div>
      )}

      <Composer
        open={composerOpen || editing !== null}
        entry={editing}
        onClose={() => {
          setComposerOpen(false)
          setEditing(null)
        }}
        onSave={(entry) => {
          if (editing) {
            updateEntry({ ...editing, ...entry })
            toast('success', 'Eintrag aktualisiert')
          } else {
            addEntry(entry)
            toast('success', 'Eintrag gespeichert')
          }
          setComposerOpen(false)
          setEditing(null)
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eintrag löschen?"
        body={`Der Eintrag zu ${pendingDelete?.teaName ?? ''} wird dauerhaft entfernt.`}
        confirmLabel="Löschen"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeEntry(pendingDelete.id)
          setPendingDelete(null)
          toast('info', 'Eintrag gelöscht')
        }}
      />
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="tnum font-display text-title2 text-ink">{value}</p>
      <p className="text-caption text-ink-3">{label}</p>
    </div>
  )
}

function Composer({
  open,
  entry,
  onClose,
  onSave,
}: {
  open: boolean
  /** Gesetzt, wenn ein bestehender Eintrag bearbeitet wird. */
  entry: JournalEntry | null
  onClose: () => void
  onSave: (entry: Omit<JournalEntry, 'id'>) => void
}) {
  const collection = useStore((state) => state.collection)
  const [teaId, setTeaId] = useState('')
  const [freeName, setFreeName] = useState('')
  const [method, setMethod] = useState('')
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [touched, setTouched] = useState(false)

  // Beim Öffnen die Werte des Eintrags übernehmen – oder leeren, wenn ein
  // neuer geschrieben wird.
  useEffect(() => {
    if (!open) return
    setTeaId(entry?.teaId ?? '')
    setFreeName(entry && !entry.teaId ? entry.teaName : '')
    setMethod(entry?.method ?? '')
    setRating(entry?.rating ?? 0)
    setNotes(entry?.notes ?? '')
    setTouched(false)
  }, [open, entry])

  const selected = collection.find((tea) => tea.id === teaId)
  const name = selected?.name ?? freeName.trim()
  const valid = name.length > 0

  const reset = () => {
    setTeaId('')
    setFreeName('')
    setMethod('')
    setRating(0)
    setNotes('')
    setTouched(false)
  }

  return (
    <Sheet
      open={open}
      title={entry ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
      onClose={() => {
        reset()
        onClose()
      }}
      footer={
        <Button
          block
          onClick={() => {
            setTouched(true)
            if (!valid) return
            onSave({
              teaId: selected?.id ?? '',
              teaName: name,
              teaBrand: selected?.brand ?? '',
              // Beim Bearbeiten bleibt der ursprüngliche Zeitpunkt stehen.
              date: entry?.date ?? new Date().toISOString(),
              method: method.trim(),
              infusions: entry?.infusions ?? 1,
              rating,
              notes: notes.trim(),
            })
            reset()
          }}
        >
          Speichern
        </Button>
      }
    >
      <div className="space-y-4 pb-2 pt-1">
        {collection.length > 0 ? (
          <Field
            label="Tee"
            required
            error={touched && !valid ? 'Bitte wähle einen Tee aus oder trage einen Namen ein.' : undefined}
          >
            {({ id, describedBy, invalid }) => (
              <select
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                value={teaId}
                onChange={(event) => setTeaId(event.target.value)}
                className="field text-callout"
              >
                <option value="">Nicht in meiner Sammlung</option>
                {collection.map((tea) => (
                  <option key={tea.id} value={tea.id}>
                    {tea.name} – {tea.brand}
                  </option>
                ))}
              </select>
            )}
          </Field>
        ) : null}

        {!selected && (
          <Field
            label="Welcher Tee war es?"
            required
            error={touched && !valid ? 'Ohne Namen lässt sich der Eintrag später nicht zuordnen.' : undefined}
          >
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                value={freeName}
                onChange={(event) => setFreeName(event.target.value)}
                placeholder="z. B. Sencha aus dem Urlaub"
              />
            )}
          </Field>
        )}

        <Field label="Zubereitung" hint="Gefäß und Menge, damit du es später nachstellen kannst.">
          {({ id, describedBy }) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              placeholder="z. B. Kyusu · 120 ml"
            />
          )}
        </Field>

        <div className="space-y-1.5">
          <p className="text-footnote font-medium text-ink-2">Bewertung</p>
          <RatingInput value={rating} onChange={setRating} />
        </div>

        <Field label="Notizen">
          {({ id, describedBy }) => (
            <TextArea
              id={id}
              aria-describedby={describedBy}
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Aroma, Farbe, Stimmung."
            />
          )}
        </Field>
      </div>
    </Sheet>
  )
}
