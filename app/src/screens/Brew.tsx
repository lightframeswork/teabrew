import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { libraryTea } from '../data/teas'
import { VESSELS, VESSEL_ORDER, VESSEL_SIZES, VESSEL_SIZE_LABEL } from '../data/vessels'
import type { JournalEntry, MatchaStyle, VesselId } from '../types'
import {
  MATCHA_PRESETS,
  buildPlan,
  effectiveBrewing,
  infusionParams,
  matchaPreset,
  methodLabel,
} from '../lib/brewing'
import { celsius, duration, grams, infusionLabel, ml, overdueLabel } from '../lib/format'
import { useTimer } from '../lib/useTimer'
import { requestWakeLock, signalDone, signalStep } from '../lib/feedback'
import { cn } from '../lib/cn'
import { Button, Card, RatingInput, SectionLabel, Stepper, TextArea } from '../components/ui'
import { Icon } from '../components/Icon'
import { TimerRing } from '../components/TimerRing'

type Phase = 'einrichten' | 'brühen' | 'nachguss' | 'fertig'

export function Brew({
  teaId,
  onBack,
  onFinish,
}: {
  teaId: string
  onBack: () => void
  onFinish: (entry?: Omit<JournalEntry, 'id'>) => void
}) {
  const collection = useStore((state) => state.collection)
  const settings = useStore((state) => state.settings)
  const setBrewingOverride = useStore((state) => state.setBrewingOverride)
  const toast = useStore((state) => state.toast)

  const tea = collection.find((item) => item.id === teaId) ?? libraryTea(teaId)
  const isMatcha = tea?.category === 'matcha'

  const base = tea ? effectiveBrewing(tea) : null
  const [vesselId, setVesselId] = useState<VesselId>(
    base && base.vessel !== 'tasse' ? base.vessel : settings.defaultVessel
  )
  const [sizeMl, setSizeMl] = useState(base?.vesselSizeMl ?? settings.defaultVesselSizeMl)
  const [matchaStyle, setMatchaStyle] = useState<MatchaStyle>('usucha')
  const [gramsOverride, setGramsOverride] = useState<number | undefined>(undefined)
  const [tempOverride, setTempOverride] = useState<number | undefined>(undefined)
  const [steepOverride, setSteepOverride] = useState<number | undefined>(undefined)
  const [fineOpen, setFineOpen] = useState(false)

  const [phase, setPhase] = useState<Phase>('einrichten')
  const [stepIndex, setStepIndex] = useState(0)
  const [infusion, setInfusion] = useState(0)
  const [rating, setRating] = useState(0)
  const [note, setNote] = useState('')

  const plan = useMemo(
    () =>
      tea
        ? buildPlan(tea, {
            vesselId: isMatcha ? 'tasse' : vesselId,
            sizeMl,
            overrideGrams: gramsOverride,
            matcha: matchaStyle,
            temperatureC: tempOverride,
            steepSeconds: steepOverride,
          })
        : null,
    [tea, isMatcha, vesselId, sizeMl, gramsOverride, matchaStyle, tempOverride, steepOverride]
  )

  const timer = useTimer(() => {
    signalDone()
    setTimerFinished(true)
  })
  const [timerFinished, setTimerFinished] = useState(false)

  // Bildschirm bleibt an, solange gebrüht wird – sonst schaltet das Display
  // mitten in der Ziehzeit ab.
  const releaseRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    const active = phase === 'brühen' || phase === 'nachguss'
    if (active && settings.keepAwake && !releaseRef.current) {
      releaseRef.current = requestWakeLock()
    }
    if ((!active || !settings.keepAwake) && releaseRef.current) {
      releaseRef.current()
      releaseRef.current = null
    }
    return () => {
      releaseRef.current?.()
      releaseRef.current = null
    }
  }, [phase, settings.keepAwake])

  if (!tea || !plan) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-body text-ink-2">Dieser Tee ist nicht mehr verfügbar.</p>
        <Button tone="secondary" onClick={onBack}>
          Zurück
        </Button>
      </div>
    )
  }

  const ownBrewing = tea.brewingOverride !== undefined
  // Für Matcha gelten feste Zeremonie-Vorgaben, und ein Kaltaufguss zieht
  // Stunden statt Sekunden – beides taugt nicht als gemerkte Einstellung.
  const canRemember = !isMatcha && vesselId !== 'kaltaufguss' && collection.some((t) => t.id === tea.id)

  const steps = plan.steps
  const step = steps[stepIndex]
  const current = infusionParams(plan, infusion)
  const maxInfusions = (plan.resteeps?.max ?? 0) + 1

  const beginStep = (index: number) => {
    setStepIndex(index)
    setTimerFinished(false)
    const next = steps[index]
    if (next?.seconds && next.seconds <= 3600) {
      timer.start(next.kind === 'steep' ? current.seconds : next.seconds)
    } else {
      timer.reset()
    }
  }

  const startBrewing = () => {
    setPhase('brühen')
    setInfusion(0)
    beginStep(0)
  }

  const nextStep = () => {
    signalStep()
    if (stepIndex < steps.length - 1) {
      beginStep(stepIndex + 1)
      return
    }
    timer.reset()
    if (plan.resteeps && plan.resteeps.max > infusion) setPhase('nachguss')
    else setPhase('fertig')
  }

  const previousStep = () => {
    if (stepIndex === 0) return
    beginStep(stepIndex - 1)
  }

  const startResteep = () => {
    const next = infusion + 1
    setInfusion(next)
    setPhase('brühen')
    const steepIndex = steps.findIndex((item) => item.kind === 'steep')
    const index = steepIndex >= 0 ? steepIndex : steps.length - 1
    setStepIndex(index)
    setTimerFinished(false)
    timer.start(infusionParams(plan, next).seconds)
  }

  const complete = (save: boolean) => {
    timer.reset()
    if (!save) {
      onFinish()
      return
    }
    onFinish({
      teaId: tea.id,
      teaName: tea.name,
      teaBrand: tea.brand,
      date: new Date().toISOString(),
      method: methodLabel(tea, isMatcha ? 'tasse' : vesselId, sizeMl, matchaStyle),
      infusions: infusion + 1,
      rating,
      notes: note.trim(),
    })
  }

  /* -------------------------------------------------------- Einrichten */

  if (phase === 'einrichten') {
    const preset = matchaPreset(matchaStyle)
    return (
      <div className="flex h-full flex-col">
        <header className="px-gutter pb-2 pt-[calc(var(--safe-top)+10px)]">
          <button
            type="button"
            onClick={onBack}
            className="pressable -ml-2 flex h-11 items-center gap-1 rounded-full pl-2 pr-3 text-ink-2"
          >
            <Icon name="zurueck" size={20} />
            <span className="text-footnote">Zurück</span>
          </button>
          <h1 className="mt-1 text-balance font-display text-title1 text-ink">{tea.name}</h1>
          <p className="text-footnote text-ink-2">Wie bereitest du ihn heute zu?</p>
        </header>

        <div className="scroll-area flex-1 px-gutter pb-4">
          {isMatcha ? (
            <section className="mt-4">
              <SectionLabel>Zubereitungsart</SectionLabel>
              <div role="radiogroup" aria-label="Zubereitungsart" className="space-y-2">
                {MATCHA_PRESETS.map((item) => {
                  const selected = matchaStyle === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setMatchaStyle(item.id)}
                      className={cn(
                        'pressable-subtle flex min-h-[64px] w-full items-center gap-3 rounded-lg border px-3.5 text-left',
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
                      <span className="min-w-0 flex-1">
                        <span className="block text-callout font-medium text-ink">{item.label}</span>
                        <span className="block text-caption text-ink-2">{item.subtitle}</span>
                      </span>
                      <span className="tnum shrink-0 text-caption text-ink-3">
                        {grams(item.matchaGrams)} · {ml(item.waterMl)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ) : (
            <>
              <section className="mt-4">
                <SectionLabel>Gefäß</SectionLabel>
                <div role="radiogroup" aria-label="Gefäß" className="grid grid-cols-2 gap-2">
                  {VESSEL_ORDER.map((id) => {
                    const item = VESSELS[id]
                    const selected = vesselId === id
                    return (
                      <button
                        key={id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setVesselId(id)}
                        className={cn(
                          'pressable-subtle min-h-[64px] rounded-lg border px-3 py-2.5 text-left',
                          selected ? 'border-accent bg-accent/8' : 'border-line bg-surface'
                        )}
                      >
                        <span
                          className={cn(
                            'block text-footnote font-semibold',
                            selected ? 'text-accent' : 'text-ink'
                          )}
                        >
                          {id === 'kaltaufguss' ? 'Kaltaufguss' : item.label}
                        </span>
                        <span className="mt-0.5 block text-caption leading-snug text-ink-2">
                          {item.subtitle}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="mt-6">
                <SectionLabel>Wassermenge</SectionLabel>
                <div role="radiogroup" aria-label="Wassermenge" className="grid grid-cols-3 gap-2">
                  {VESSEL_SIZES.map((value) => {
                    const selected = sizeMl === value
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => {
                          setSizeMl(value)
                          setGramsOverride(undefined)
                        }}
                        title={VESSEL_SIZE_LABEL[value]}
                        className={cn(
                          'pressable-subtle tnum min-h-[46px] rounded-lg border text-footnote font-semibold',
                          selected
                            ? 'border-accent bg-accent/8 text-accent'
                            : 'border-line bg-surface text-ink'
                        )}
                      >
                        {ml(value)}
                      </button>
                    )
                  })}
                </div>
              </section>
            </>
          )}

          <section className="mt-6">
            <SectionLabel>Das ergibt</SectionLabel>
            <Card className="divide-y divide-line">
              <Row label="Wasser" value={ml(plan.waterMl)} />
              <Row label="Temperatur" value={celsius(plan.temperatureC)} />
              <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                <span className="text-footnote text-ink-2">
                  {isMatcha ? 'Matcha' : 'Teemenge'}
                  {!isMatcha && gramsOverride !== undefined && (
                    <span className="ml-1.5 text-caption text-heat">angepasst</span>
                  )}
                </span>
                {isMatcha ? (
                  <span className="tnum text-callout font-semibold text-ink">
                    {grams(preset.matchaGrams)}
                  </span>
                ) : (
                  <Stepper
                    label="Teemenge"
                    value={plan.teaGrams}
                    display={grams(plan.teaGrams)}
                    canDecrease={plan.teaGrams > 0.5}
                    canIncrease={plan.teaGrams < 30}
                    onDecrease={() => setGramsOverride(Math.max(0.5, plan.teaGrams - 0.5))}
                    onIncrease={() => setGramsOverride(Math.min(30, plan.teaGrams + 0.5))}
                  />
                )}
              </div>
              {!isMatcha && (
                <Row
                  label="Ziehzeit"
                  value={vesselId === 'kaltaufguss' ? 'mehrere Stunden' : duration(plan.steepSeconds)}
                />
              )}
            </Card>
            {plan.capped && gramsOverride === undefined && (
              <p className="mt-2 flex items-start gap-2 text-caption text-ink-3">
                <Icon name="info" size={13} className="mt-0.5 shrink-0" />
                <span className="text-pretty">
                  Rechnerisch wären es {grams(plan.suggestedGrams)}. Für so große Mengen ist das
                  meist zu viel Blatt – deshalb liegt der Vorschlag darunter.
                </span>
              </p>
            )}
          </section>

          {canRemember && (
            <section className="mt-6">
              <button
                type="button"
                aria-expanded={fineOpen}
                onClick={() => setFineOpen((value) => !value)}
                className="pressable-subtle flex min-h-[44px] w-full items-center justify-between text-left text-footnote font-semibold text-ink-2"
              >
                Feinjustierung
                <Icon
                  name="runter"
                  size={16}
                  className={cn(
                    'text-ink-3 transition-transform duration-200 ease-out',
                    fineOpen && 'rotate-180'
                  )}
                />
              </button>

              {fineOpen && (
                <div className="anim-fade">
                  <Card className="divide-y divide-line">
                    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                      <span className="text-footnote text-ink-2">Temperatur</span>
                      <Stepper
                        label="Temperatur"
                        value={plan.temperatureC}
                        display={celsius(plan.temperatureC)}
                        canDecrease={plan.temperatureC > 40}
                        canIncrease={plan.temperatureC < 100}
                        onDecrease={() => setTempOverride(Math.max(40, plan.temperatureC - 5))}
                        onIncrease={() => setTempOverride(Math.min(100, plan.temperatureC + 5))}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                      <span className="text-footnote text-ink-2">Ziehzeit</span>
                      <Stepper
                        label="Ziehzeit"
                        value={plan.steepSeconds}
                        display={duration(plan.steepSeconds)}
                        canDecrease={plan.steepSeconds > 10}
                        canIncrease={plan.steepSeconds < 1800}
                        onDecrease={() => setSteepOverride(Math.max(10, plan.steepSeconds - 10))}
                        onIncrease={() => setSteepOverride(Math.min(1800, plan.steepSeconds + 10))}
                      />
                    </div>
                  </Card>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      tone="secondary"
                      icon="haken"
                      onClick={() => {
                        setBrewingOverride(tea.id, {
                          ...effectiveBrewing(tea),
                          vessel: vesselId,
                          vesselSizeMl: sizeMl,
                          teaGrams: plan.teaGrams,
                          temperatureC: plan.temperatureC,
                          steepSeconds: plan.steepSeconds,
                        })
                        toast('success', 'Als deine Einstellung gemerkt')
                      }}
                    >
                      Als meine Einstellung merken
                    </Button>
                    {ownBrewing && (
                      <Button
                        tone="ghost"
                        onClick={() => {
                          setBrewingOverride(tea.id, null)
                          setTempOverride(undefined)
                          setSteepOverride(undefined)
                          setGramsOverride(undefined)
                          setVesselId(tea.brewing.vessel)
                          setSizeMl(tea.brewing.vesselSizeMl)
                          toast('info', 'Zurück auf die Empfehlung')
                        }}
                      >
                        Zurücksetzen
                      </Button>
                    )}
                  </div>
                  <p className="mt-2 text-caption text-ink-3">
                    Gemerkt wird alles auf dieser Seite: Gefäß, Menge, Temperatur und Ziehzeit.
                  </p>
                </div>
              )}
            </section>
          )}

          <div className="h-28" />
        </div>

        <div className="material material-bottom absolute inset-x-0 bottom-0 z-20 px-gutter pb-[calc(var(--safe-bottom)+14px)] pt-3">
          <Button block icon="start" onClick={startBrewing}>
            Los geht’s
          </Button>
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------------ Fertig */

  if (phase === 'fertig') {
    return (
      <div className="flex h-full flex-col">
        <div className="scroll-area flex-1 px-gutter pt-[calc(var(--safe-top)+28px)]">
          <div className="anim-rise flex flex-col items-center text-center">
            <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-on">
              <Icon name="haken" size={30} strokeWidth={2.4} />
            </span>
            <h1 className="font-display text-title1 text-ink">Fertig</h1>
            <p className="mt-1.5 text-body text-ink-2">
              {tea.name} · {infusionLabel(infusion + 1)}
            </p>
          </div>

          <section className="mt-9">
            <SectionLabel>Wie war er?</SectionLabel>
            <RatingInput value={rating} onChange={setRating} label="Bewertung" />
          </section>

          <section className="mt-6">
            <SectionLabel>Notiz</SectionLabel>
            <TextArea
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Aroma, Farbe, Stimmung – was dir aufgefallen ist."
              aria-label="Notiz zum Aufguss"
            />
          </section>

          <div className="mt-7 space-y-2 pb-10">
            <Button block icon="buch" onClick={() => complete(true)}>
              Im Journal speichern
            </Button>
            <Button tone="ghost" block onClick={() => complete(false)}>
              Ohne Eintrag beenden
            </Button>
          </div>
        </div>
      </div>
    )
  }

  /* ---------------------------------------------------------- Nachguss */

  if (phase === 'nachguss') {
    const next = infusionParams(plan, infusion + 1)
    const left = (plan.resteeps?.max ?? 0) - infusion
    return (
      <div className="flex h-full flex-col justify-center px-gutter">
        <div className="anim-rise">
          <p className="text-footnote text-ink-2">{infusionLabel(infusion + 1)} getrunken</p>
          <h1 className="mt-1 text-balance font-display text-title1 text-ink">
            Noch ein Aufguss?
          </h1>
          <p className="mt-2 text-pretty text-body text-ink-2">
            Die Blätter geben noch etwas her. Der nächste Aufguss zieht{' '}
            <span className="tnum">{duration(next.seconds)}</span> bei{' '}
            <span className="tnum">{celsius(next.temperatureC)}</span>.
          </p>

          <Card className="mt-6 divide-y divide-line">
            <Row label="Nächster Aufguss" value={`${infusion + 2}. von ${maxInfusions}`} />
            <Row label="Ziehzeit" value={duration(next.seconds)} />
            <Row label="Temperatur" value={celsius(next.temperatureC)} />
          </Card>

          <p className="mt-2 text-caption text-ink-3">
            {left === 1
              ? 'Danach ist bei diesem Tee Schluss.'
              : left === 2
                ? 'Danach ist noch ein weiterer möglich.'
                : `Danach sind noch ${left - 1} weitere möglich.`}
          </p>

          <div className="mt-7 space-y-2">
            <Button block icon="wiederholen" onClick={startResteep}>
              Nächsten Aufguss starten
            </Button>
            <Button tone="secondary" block onClick={() => setPhase('fertig')}>
              Für heute reicht’s
            </Button>
          </div>
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------------ Brühen */

  const isTimed = Boolean(step?.seconds) && step.seconds! <= 3600
  const progressPercent = ((stepIndex + 1) / steps.length) * 100

  return (
    <div className="flex h-full flex-col">
      <header className="px-gutter pb-1 pt-[calc(var(--safe-top)+10px)]">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="pressable -ml-2 flex h-11 items-center gap-1 rounded-full pl-2 pr-3 text-ink-2"
          >
            <Icon name="kreuz" size={18} />
            <span className="text-footnote">Abbrechen</span>
          </button>
          <span className="tnum text-caption text-ink-3">
            {infusion > 0 ? `${infusion + 1}. Aufguss · ` : ''}
            Schritt {stepIndex + 1} von {steps.length}
          </span>
        </div>
        <div
          className="mt-2 h-1 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={stepIndex + 1}
          aria-label="Fortschritt der Zubereitung"
        >
          <span
            className="block h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      <div className="scroll-area flex flex-1 flex-col items-center justify-center px-gutter text-center">
        <div key={`${infusion}-${stepIndex}`} className="anim-rise flex w-full flex-col items-center">
          <h1 className="text-balance font-display text-title1 text-ink">{step.title}</h1>
          <p className="mt-2 max-w-[34ch] text-pretty text-callout text-ink-2">{step.description}</p>

          {isTimed ? (
            <div className="mt-7 flex flex-col items-center">
              <TimerRing
                seconds={timer.remainingSeconds}
                progress={timer.progress}
                running={timer.running}
                label={
                  timerFinished
                    ? overdueLabel(timer.overdueSeconds)
                    : timer.running
                      ? 'läuft'
                      : 'pausiert'
                }
              />
              <p className="sr-only" aria-live="polite">
                {timerFinished ? overdueLabel(timer.overdueSeconds) : ''}
              </p>
              <div className="mt-5 flex items-center gap-2">
                <Button
                  tone="secondary"
                  onClick={() => timer.addSeconds(-10)}
                  disabled={timer.remainingSeconds <= 10}
                  aria-label="Zehn Sekunden abziehen"
                >
                  −10 s
                </Button>
                <Button
                  tone="secondary"
                  icon={timer.running ? 'pause' : 'start'}
                  onClick={timer.toggle}
                  disabled={timer.remainingSeconds === 0}
                >
                  {timer.running ? 'Pause' : 'Weiter'}
                </Button>
                <Button
                  tone="secondary"
                  onClick={() => timer.addSeconds(10)}
                  aria-label="Zehn Sekunden zugeben"
                >
                  +10 s
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-8 flex h-[232px] w-[232px] items-center justify-center rounded-full border border-line text-ink-3">
              <Icon name={iconForStep(step.kind)} size={64} strokeWidth={1.1} />
            </div>
          )}

          {step.hint && (
            <p className="mt-6 flex max-w-[34ch] items-start gap-2 text-left text-caption text-ink-3">
              <Icon name="info" size={13} className="mt-0.5 shrink-0" />
              <span className="text-pretty">{step.hint}</span>
            </p>
          )}
        </div>
        <div className="h-20 shrink-0" />
      </div>

      <div className="material material-bottom absolute inset-x-0 bottom-0 z-20 flex items-center gap-2 px-gutter pb-[calc(var(--safe-bottom)+14px)] pt-3">
        <Button
          tone="secondary"
          icon="zurueck"
          onClick={previousStep}
          disabled={stepIndex === 0}
          aria-label="Vorheriger Schritt"
          className="px-4"
        >
          <span className="sr-only">Vorheriger Schritt</span>
        </Button>
        <Button block iconRight="weiter" onClick={nextStep}>
          {stepIndex === steps.length - 1 ? 'Abschließen' : 'Weiter'}
        </Button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5">
      <span className="text-footnote text-ink-2">{label}</span>
      <span className="tnum text-callout font-semibold text-ink">{value}</span>
    </div>
  )
}

function iconForStep(kind: string) {
  switch (kind) {
    case 'heat':
      return 'kessel' as const
    case 'preheat':
      return 'tropfen' as const
    case 'dose':
      return 'blatt' as const
    case 'rinse':
      return 'wiederholen' as const
    case 'pour':
      return 'kanne' as const
    case 'sift':
      return 'waage' as const
    case 'whisk':
      return 'besen' as const
    case 'milk':
      return 'tropfen' as const
    case 'chill':
      return 'mond' as const
    case 'strain':
      return 'kanne' as const
    default:
      return 'schale' as const
  }
}
