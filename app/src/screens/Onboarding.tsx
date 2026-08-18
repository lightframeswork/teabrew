import { useState } from 'react'
import { useStore } from '../store/useStore'
import { ONBOARDING_VESSELS, VESSELS, VESSEL_SIZES, VESSEL_SIZE_LABEL } from '../data/vessels'
import type { VesselId } from '../types'
import { Button, TextInput } from '../components/ui'
import { Icon } from '../components/Icon'
import { cn } from '../lib/cn'
import { ml } from '../lib/format'

const SLIDES = [
  {
    icon: 'blatt' as const,
    title: 'Willkommen bei Chado',
    body: 'Deine Teesammlung an einem Ort – und zu jedem Tee die Zubereitung, die zu ihm passt.',
  },
  {
    icon: 'sanduhr' as const,
    title: 'Aussuchen, aufgießen, trinken',
    body: 'Chado führt dich Schritt für Schritt durch die Zubereitung, mit Timer für jede Ziehzeit und Vorschlägen für die Folgeaufgüsse.',
  },
]

export function Onboarding({ onDone }: { onDone: () => void }) {
  const updateSettings = useStore((state) => state.updateSettings)
  const completeOnboarding = useStore((state) => state.completeOnboarding)

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [vessel, setVessel] = useState<VesselId>('kyusu')
  const [size, setSize] = useState(120)

  const finish = () => {
    updateSettings({
      userName: name.trim(),
      defaultVessel: vessel,
      defaultVesselSizeMl: size,
    })
    completeOnboarding()
    onDone()
  }

  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex justify-center gap-1.5 pt-[calc(var(--safe-top)+20px)]">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            aria-hidden
            className="h-1.5 rounded-full transition-all duration-300 ease-out"
            style={{
              width: index === step ? 22 : 7,
              background: index === step ? 'rgb(var(--accent))' : 'rgb(var(--line-strong))',
            }}
          />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        Schritt {step + 1} von 3
      </p>

      <div className="scroll-area flex-1 px-7">
        {step < 2 ? (
          <div key={step} className="anim-rise flex h-full flex-col items-center justify-center text-center">
            <span className="anim-breathe mb-9 flex h-32 w-32 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Icon name={SLIDES[step].icon} size={54} strokeWidth={1.3} />
            </span>
            <h1 className="text-balance font-display text-display1 text-ink">{SLIDES[step].title}</h1>
            <p className="mt-3 max-w-[32ch] text-pretty text-callout text-ink-2">{SLIDES[step].body}</p>
          </div>
        ) : (
          <div className="anim-rise pt-6">
            <h1 className="text-balance font-display text-title1 text-ink">Wie brühst du am liebsten?</h1>
            <p className="mt-2 text-body text-ink-2">
              Das legt nur die Voreinstellung fest. Bei jedem Tee kannst du es ändern.
            </p>

            <div className="mt-7">
              <p className="mb-2 text-footnote font-semibold text-ink-2">Dein Name</p>
              <TextInput
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Wird nur für die Begrüßung verwendet"
                autoComplete="given-name"
                enterKeyHint="next"
              />
            </div>

            <div className="mt-6">
              <p className="mb-2 text-footnote font-semibold text-ink-2">Gefäß</p>
              <div role="radiogroup" aria-label="Gefäß" className="space-y-2">
                {ONBOARDING_VESSELS.map((id) => {
                  const item = VESSELS[id]
                  const selected = vessel === id
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setVessel(id)}
                      className={cn(
                        'pressable-subtle flex min-h-[58px] w-full items-center gap-3 rounded-lg border px-3.5 text-left',
                        selected ? 'border-accent bg-accent/8' : 'border-line bg-surface'
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                          selected ? 'border-accent bg-accent text-accent-on' : 'border-line-strong'
                        )}
                      >
                        {selected && <Icon name="haken" size={11} strokeWidth={3} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-callout font-medium text-ink">{item.label}</span>
                        <span className="block truncate text-caption text-ink-2">{item.subtitle}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 pb-8">
              <p className="mb-2 text-footnote font-semibold text-ink-2">Übliche Menge</p>
              <div role="radiogroup" aria-label="Übliche Menge" className="grid grid-cols-2 gap-2">
                {VESSEL_SIZES.map((value) => {
                  const selected = size === value
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setSize(value)}
                      className={cn(
                        'pressable-subtle min-h-[58px] rounded-lg border px-3 py-2.5 text-left',
                        selected ? 'border-accent bg-accent/8' : 'border-line bg-surface'
                      )}
                    >
                      <span
                        className={cn(
                          'tnum block text-callout font-semibold',
                          selected ? 'text-accent' : 'text-ink'
                        )}
                      >
                        {ml(value)}
                      </span>
                      <span className="block text-caption text-ink-2">
                        {VESSEL_SIZE_LABEL[value]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 px-7 pb-[calc(var(--safe-bottom)+24px)] pt-4">
        {step > 0 ? (
          <Button tone="ghost" icon="zurueck" onClick={() => setStep(step - 1)}>
            Zurück
          </Button>
        ) : (
          <Button tone="ghost" onClick={finish}>
            Überspringen
          </Button>
        )}
        <Button
          iconRight={step < 2 ? 'weiter' : undefined}
          onClick={() => (step < 2 ? setStep(step + 1) : finish())}
        >
          {step < 2 ? 'Weiter' : 'Loslegen'}
        </Button>
      </div>
    </div>
  )
}
