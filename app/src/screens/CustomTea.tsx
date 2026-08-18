import { useMemo, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { CATEGORIES } from '../data/categories'
import { VESSELS, VESSEL_ORDER } from '../data/vessels'
import type { CaffeineLevel, CategoryId, Tea, VesselId } from '../types'
import { ScreenHeader } from '../components/Shell'
import { Button, Card, Field, SectionLabel, TextArea, TextInput } from '../components/ui'
import { cn } from '../lib/cn'

interface Draft {
  name: string
  brand: string
  category: CategoryId
  variety: string
  origin: string
  description: string
  caffeine: CaffeineLevel
  vessel: VesselId
  vesselSizeMl: string
  teaGrams: string
  temperatureC: string
  steepMinutes: string
  steepSeconds: string
  preheatVessel: boolean
  rinse: boolean
  resteeps: string
  tags: string
  notes: string
}

const EMPTY: Draft = {
  name: '',
  brand: '',
  category: 'gruentee',
  variety: '',
  origin: '',
  description: '',
  caffeine: 'mittel',
  vessel: 'teekanne',
  vesselSizeMl: '200',
  teaGrams: '3',
  temperatureC: '80',
  steepMinutes: '2',
  steepSeconds: '0',
  preheatVessel: true,
  rinse: false,
  resteeps: '0',
  tags: '',
  notes: '',
}

const CAFFEINE_OPTIONS: Array<{ value: CaffeineLevel; label: string }> = [
  { value: 'keins', label: 'koffeinfrei' },
  { value: 'wenig', label: 'wenig' },
  { value: 'mittel', label: 'mittel' },
  { value: 'viel', label: 'viel' },
]

function toNumber(value: string): number {
  return Number(value.replace(',', '.'))
}

export function CustomTea({ onBack, onSaved }: { onBack: () => void; onSaved: (id: string) => void }) {
  const addTea = useStore((state) => state.addTea)
  const toast = useStore((state) => state.toast)

  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [submitted, setSubmitted] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }))

  const errors = useMemo(() => {
    const result: Partial<Record<keyof Draft, string>> = {}
    if (!draft.name.trim()) result.name = 'Ohne Namen findest du den Tee später nicht wieder.'
    const size = toNumber(draft.vesselSizeMl)
    if (!Number.isFinite(size) || size < 20 || size > 2000)
      result.vesselSizeMl = 'Bitte einen Wert zwischen 20 und 2000 ml eintragen.'
    const gram = toNumber(draft.teaGrams)
    if (!Number.isFinite(gram) || gram <= 0 || gram > 100)
      result.teaGrams = 'Bitte eine Menge zwischen 0,5 und 100 g eintragen.'
    const temp = toNumber(draft.temperatureC)
    if (!Number.isFinite(temp) || temp < 40 || temp > 100)
      result.temperatureC = 'Sinnvoll sind 40 bis 100 °C.'
    const total = toNumber(draft.steepMinutes) * 60 + toNumber(draft.steepSeconds)
    if (!Number.isFinite(total) || total < 5 || total > 3600)
      result.steepMinutes = 'Die Ziehzeit sollte zwischen 5 Sekunden und einer Stunde liegen.'
    return result
  }, [draft])

  const save = () => {
    setSubmitted(true)
    if (Object.keys(errors).length > 0) {
      toast('danger', 'Bitte prüfe die rot markierten Felder.')
      // Ein Fehler weit oben im Formular bleibt sonst unbemerkt: zum ersten
      // beanstandeten Feld scrollen und den Fokus dorthin setzen.
      window.requestAnimationFrame(() => {
        const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
        invalid?.scrollIntoView({ block: 'center', behavior: 'smooth' })
        invalid?.focus({ preventScroll: true })
      })
      return
    }

    const steep = Math.round(toNumber(draft.steepMinutes) * 60 + toNumber(draft.steepSeconds))
    const resteeps = Math.max(0, Math.round(toNumber(draft.resteeps) || 0))
    const id = `eigener-${draft.name
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}-${Date.now().toString(36)}`

    const tea: Tea = {
      id,
      name: draft.name.trim(),
      brand: draft.brand.trim() || 'Eigener Tee',
      category: draft.category,
      variety: draft.variety.trim() || CATEGORIES.find((c) => c.id === draft.category)!.label,
      tradition: draft.variety.trim() || '—',
      origin: draft.origin.trim() || 'ohne Angabe',
      originDetail: '',
      description: draft.description.trim() || 'Selbst angelegt – ohne Beschreibung.',
      caffeine: draft.caffeine,
      tags: draft.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      custom: true,
      personalNotes: draft.notes.trim() || undefined,
      brewing: {
        vessel: draft.vessel,
        vesselSizeMl: Math.round(toNumber(draft.vesselSizeMl)),
        teaGrams: Math.round(toNumber(draft.teaGrams) * 2) / 2,
        temperatureC: Math.round(toNumber(draft.temperatureC)),
        steepSeconds: steep,
        preheatVessel: draft.preheatVessel,
        preheatCups: false,
        rinse: draft.rinse,
        resteeps:
          resteeps > 0 ? { max: resteeps, addSeconds: 15, addTemperatureC: 5 } : null,
      },
    }

    addTea(tea)
    toast('success', `${tea.name} angelegt`)
    onSaved(id)
  }

  const showError = (key: keyof Draft) => (submitted ? errors[key] : undefined)

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Eigener Tee" subtitle="Nur der Name ist Pflicht" onBack={onBack} />

      <div ref={formRef} className="scroll-area flex-1 px-gutter">
        <section className="pt-2">
          <SectionLabel>Der Tee</SectionLabel>
          <div className="space-y-4">
            <Field label="Name" required error={showError('name')}>
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  value={draft.name}
                  onChange={(event) => set('name', event.target.value)}
                  placeholder="z. B. Kaboku Sencha"
                  autoComplete="off"
                />
              )}
            </Field>

            <Field label="Marke oder Händler">
              {({ id }) => (
                <TextInput
                  id={id}
                  value={draft.brand}
                  onChange={(event) => set('brand', event.target.value)}
                  placeholder="z. B. Ippodo"
                  autoComplete="off"
                />
              )}
            </Field>

            <div className="space-y-1.5">
              <p className="text-footnote font-medium text-ink-2">Sorte</p>
              <div role="radiogroup" aria-label="Sorte" className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    role="radio"
                    aria-checked={draft.category === cat.id}
                    onClick={() => set('category', cat.id)}
                    className={cn(
                      'pressable-subtle min-h-[38px] rounded-full border px-3.5 text-footnote',
                      draft.category === cat.id
                        ? 'border-ink bg-ink font-medium text-canvas'
                        : 'border-line bg-surface text-ink-2'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Untersorte" hint="z. B. Gyokuro, Assam, Bai Mudan.">
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  value={draft.variety}
                  onChange={(event) => set('variety', event.target.value)}
                  placeholder="z. B. Sencha"
                  autoComplete="off"
                />
              )}
            </Field>

            <Field label="Herkunft">
              {({ id }) => (
                <TextInput
                  id={id}
                  value={draft.origin}
                  onChange={(event) => set('origin', event.target.value)}
                  placeholder="z. B. Japan, Kyoto"
                  autoComplete="off"
                />
              )}
            </Field>

            <Field label="Beschreibung">
              {({ id }) => (
                <TextArea
                  id={id}
                  rows={3}
                  value={draft.description}
                  onChange={(event) => set('description', event.target.value)}
                  placeholder="Wie schmeckt er? Woher hast du ihn?"
                />
              )}
            </Field>

            <div className="space-y-1.5">
              <p className="text-footnote font-medium text-ink-2">Koffein</p>
              <div role="radiogroup" aria-label="Koffein" className="flex gap-1.5">
                {CAFFEINE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={draft.caffeine === option.value}
                    onClick={() => set('caffeine', option.value)}
                    className={cn(
                      'pressable-subtle min-h-[38px] flex-1 rounded-lg border text-caption',
                      draft.caffeine === option.value
                        ? 'border-accent bg-accent/8 font-medium text-accent'
                        : 'border-line bg-surface text-ink-2'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <SectionLabel>Zubereitung</SectionLabel>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-footnote font-medium text-ink-2">Gefäß</p>
              <div role="radiogroup" aria-label="Gefäß" className="grid grid-cols-2 gap-2">
                {VESSEL_ORDER.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={draft.vessel === id}
                    onClick={() => set('vessel', id)}
                    className={cn(
                      'pressable-subtle min-h-[44px] rounded-lg border px-3 text-footnote',
                      draft.vessel === id
                        ? 'border-accent bg-accent/8 font-medium text-accent'
                        : 'border-line bg-surface text-ink-2'
                    )}
                  >
                    {id === 'kaltaufguss' ? 'Kaltaufguss' : VESSELS[id].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Wasser (ml)" error={showError('vesselSizeMl')}>
                {({ id, describedBy, invalid }) => (
                  <TextInput
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    inputMode="numeric"
                    value={draft.vesselSizeMl}
                    onChange={(event) => set('vesselSizeMl', event.target.value)}
                  />
                )}
              </Field>
              <Field label="Teemenge (g)" error={showError('teaGrams')}>
                {({ id, describedBy, invalid }) => (
                  <TextInput
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    inputMode="decimal"
                    value={draft.teaGrams}
                    onChange={(event) => set('teaGrams', event.target.value)}
                  />
                )}
              </Field>
            </div>

            <Field label="Temperatur (°C)" error={showError('temperatureC')}>
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  inputMode="numeric"
                  value={draft.temperatureC}
                  onChange={(event) => set('temperatureC', event.target.value)}
                />
              )}
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ziehzeit (Minuten)" error={showError('steepMinutes')}>
                {({ id, describedBy, invalid }) => (
                  <TextInput
                    id={id}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    inputMode="numeric"
                    value={draft.steepMinutes}
                    onChange={(event) => set('steepMinutes', event.target.value)}
                  />
                )}
              </Field>
              <Field label="Ziehzeit (Sekunden)">
                {({ id }) => (
                  <TextInput
                    id={id}
                    inputMode="numeric"
                    value={draft.steepSeconds}
                    onChange={(event) => set('steepSeconds', event.target.value)}
                  />
                )}
              </Field>
            </div>

            <Field label="Weitere Aufgüsse" hint="0 bedeutet: nur ein Aufguss.">
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  inputMode="numeric"
                  value={draft.resteeps}
                  onChange={(event) => set('resteeps', event.target.value)}
                />
              )}
            </Field>

            <Card className="divide-y divide-line">
              <Toggle
                label="Gefäß vorwärmen"
                checked={draft.preheatVessel}
                onChange={(value) => set('preheatVessel', value)}
              />
              <Toggle
                label="Blätter kurz waschen"
                hint="Üblich bei Oolong und Pu-Erh."
                checked={draft.rinse}
                onChange={(value) => set('rinse', value)}
              />
            </Card>
          </div>
        </section>

        <section className="mt-8 pb-10">
          <SectionLabel>Persönliches</SectionLabel>
          <div className="space-y-4">
            <Field label="Merkmale" hint="Mit Komma trennen, z. B. blumig, süß, Frühling.">
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  value={draft.tags}
                  onChange={(event) => set('tags', event.target.value)}
                  placeholder="blumig, süß"
                />
              )}
            </Field>
            <Field label="Notizen">
              {({ id }) => (
                <TextArea
                  id={id}
                  rows={3}
                  value={draft.notes}
                  onChange={(event) => set('notes', event.target.value)}
                  placeholder="Woher der Tee stammt, was du beim nächsten Mal anders machst."
                />
              )}
            </Field>
          </div>
        </section>

        <div className="h-28" />
      </div>

      <div className="material material-bottom absolute inset-x-0 bottom-0 z-20 px-gutter pb-[calc(var(--safe-bottom)+14px)] pt-3">
        <Button block icon="haken" onClick={save}>
          Tee speichern
        </Button>
      </div>
    </div>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="pressable-subtle flex min-h-[52px] w-full items-center justify-between gap-3 px-3.5 py-2 text-left"
    >
      <span className="min-w-0">
        <span className="block text-footnote font-medium text-ink">{label}</span>
        {hint && <span className="block text-caption text-ink-3">{hint}</span>}
      </span>
      <span
        aria-hidden
        className={cn(
          'relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-200 ease-out',
          checked ? 'bg-accent' : 'bg-line-strong'
        )}
      >
        <span
          className="absolute top-[3px] h-5 w-5 rounded-full bg-surface transition-transform duration-200 ease-out"
          style={{ transform: `translateX(${checked ? 21 : 3}px)` }}
        />
      </span>
    </button>
  )
}
