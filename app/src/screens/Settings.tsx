import { useState } from 'react'
import { useStore } from '../store/useStore'
import { VESSELS, VESSEL_ORDER, VESSEL_SIZES, VESSEL_SIZE_LABEL } from '../data/vessels'
import type { ThemeMode, VesselId } from '../types'
import { ml } from '../lib/format'
import { cn } from '../lib/cn'
import {
  Button,
  Card,
  ConfirmDialog,
  Field,
  SectionLabel,
  Segmented,
  TextInput,
} from '../components/ui'
import { Icon } from '../components/Icon'

export function Settings() {
  const settings = useStore((state) => state.settings)
  const updateSettings = useStore((state) => state.updateSettings)
  const collection = useStore((state) => state.collection)
  const journal = useStore((state) => state.journal)
  const clearCollection = useStore((state) => state.clearCollection)
  const toast = useStore((state) => state.toast)

  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <header className="px-gutter pb-3 pt-[calc(var(--safe-top)+20px)]">
        <h1 className="font-display text-display1 text-ink">Einstellungen</h1>
      </header>

      <div className="scroll-area flex-1 px-gutter">
        <section className="pt-2">
          <SectionLabel>Darstellung</SectionLabel>
          <Segmented<ThemeMode>
            label="Erscheinungsbild"
            value={settings.theme}
            onChange={(theme) => updateSettings({ theme })}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Hell' },
              { value: 'dark', label: 'Dunkel' },
            ]}
          />
          <p className="mt-2 text-caption text-ink-3">
            „System“ folgt der Einstellung deines Geräts – abends also automatisch dunkel.
          </p>
        </section>

        <section className="mt-8">
          <SectionLabel>Begrüßung</SectionLabel>
          <Field label="Dein Name" hint="Erscheint auf der Startseite. Bleibt auf diesem Gerät.">
            {({ id, describedBy }) => (
              <TextInput
                id={id}
                aria-describedby={describedBy}
                value={settings.userName}
                onChange={(event) => updateSettings({ userName: event.target.value })}
                placeholder="Ohne Namen grüßt Chado neutral"
                autoComplete="given-name"
              />
            )}
          </Field>
        </section>

        <section className="mt-8">
          <SectionLabel>Voreinstellung fürs Aufgießen</SectionLabel>
          <div role="radiogroup" aria-label="Gefäß" className="grid grid-cols-2 gap-2">
            {VESSEL_ORDER.map((id: VesselId) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={settings.defaultVessel === id}
                onClick={() => updateSettings({ defaultVessel: id })}
                className={cn(
                  'pressable-subtle min-h-[44px] rounded-lg border px-3 text-footnote',
                  settings.defaultVessel === id
                    ? 'border-accent bg-accent/8 font-medium text-accent'
                    : 'border-line bg-surface text-ink-2'
                )}
              >
                {id === 'kaltaufguss' ? 'Kaltaufguss' : VESSELS[id].label}
              </button>
            ))}
          </div>

          <p className="mb-2 mt-4 text-footnote font-medium text-ink-2">Übliche Menge</p>
          <div role="radiogroup" aria-label="Übliche Menge" className="grid grid-cols-3 gap-2">
            {VESSEL_SIZES.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={settings.defaultVesselSizeMl === value}
                onClick={() => updateSettings({ defaultVesselSizeMl: value })}
                title={VESSEL_SIZE_LABEL[value]}
                className={cn(
                  'pressable-subtle tnum min-h-[44px] rounded-lg border text-footnote font-semibold',
                  settings.defaultVesselSizeMl === value
                    ? 'border-accent bg-accent/8 text-accent'
                    : 'border-line bg-surface text-ink'
                )}
              >
                {ml(value)}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <SectionLabel>Während der Zubereitung</SectionLabel>
          <Card className="divide-y divide-line">
            <Switch
              label="Signalton"
              hint="Ein kurzer Ton, wenn die Ziehzeit abgelaufen ist."
              checked={settings.sound}
              onChange={(sound) => updateSettings({ sound })}
            />
            <Switch
              label="Vibration"
              hint="Zusätzlich spürbar, auch wenn das Gerät stumm ist."
              checked={settings.haptics}
              onChange={(haptics) => updateSettings({ haptics })}
            />
            <Switch
              label="Bildschirm anlassen"
              hint="Verhindert, dass sich das Display mitten im Aufguss abschaltet."
              checked={settings.keepAwake}
              onChange={(keepAwake) => updateSettings({ keepAwake })}
            />
          </Card>
        </section>

        <section className="mt-8">
          <SectionLabel>Deine Daten</SectionLabel>
          <Card className="divide-y divide-line">
            <Row label="Tees in der Sammlung" value={String(collection.length)} />
            <Row label="Journaleinträge" value={String(journal.length)} />
          </Card>
          <p className="mt-2 flex items-start gap-2 text-caption text-ink-3">
            <Icon name="info" size={13} className="mt-0.5 shrink-0" />
            <span className="text-pretty">
              Alles bleibt auf diesem Gerät. Chado sendet nichts an einen Server und braucht kein
              Konto.
            </span>
          </p>

          {collection.length > 0 && (
            <div className="mt-4">
              <Button tone="danger" block icon="papierkorb" onClick={() => setConfirmClear(true)}>
                Sammlung leeren
              </Button>
            </div>
          )}
        </section>

        <section className="mt-10 pb-12 text-center">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Icon name="blatt" size={22} />
          </span>
          <p className="mt-2 font-display text-title3 text-ink">Chado</p>
          <p className="text-caption text-ink-3">Tee-Assistent · Version 2.0</p>
        </section>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Sammlung leeren?"
        body={`${collection.length} ${collection.length === 1 ? 'Tee wird' : 'Tees werden'} entfernt, ebenso deine Favoriten. Journaleinträge bleiben erhalten. Das lässt sich nicht rückgängig machen.`}
        confirmLabel="Leeren"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearCollection()
          setConfirmClear(false)
          toast('info', 'Sammlung geleert')
        }}
      />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-3">
      <span className="text-footnote text-ink-2">{label}</span>
      <span className="tnum text-callout font-semibold text-ink">{value}</span>
    </div>
  )
}

function Switch({
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
      className="pressable-subtle flex min-h-[58px] w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left"
    >
      <span className="min-w-0">
        <span className="block text-footnote font-medium text-ink">{label}</span>
        {hint && <span className="block text-pretty text-caption text-ink-3">{hint}</span>}
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
