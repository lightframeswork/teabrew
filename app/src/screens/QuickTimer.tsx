import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { useTimer } from '../lib/useTimer'
import { requestWakeLock, signalDone } from '../lib/feedback'
import { duration, overdueLabel } from '../lib/format'
import { ScreenHeader } from '../components/Shell'
import { Button, SectionLabel } from '../components/ui'
import { TimerRing } from '../components/TimerRing'
import { Icon } from '../components/Icon'
import { cn } from '../lib/cn'

/** Übliche Ziehzeiten – von Gyokuro bis Kräutertee. */
const PRESETS = [30, 45, 60, 90, 120, 180, 240, 300, 420] as const

export function QuickTimer({ onBack }: { onBack: () => void }) {
  const keepAwake = useStore((state) => state.settings.keepAwake)
  const [finished, setFinished] = useState(false)
  const [lastSeconds, setLastSeconds] = useState(60)

  const timer = useTimer(() => {
    signalDone()
    setFinished(true)
  })

  const releaseRef = useRef<(() => void) | null>(null)
  useEffect(() => {
    if (timer.running && keepAwake && !releaseRef.current) {
      releaseRef.current = requestWakeLock()
    }
    if ((!timer.running || !keepAwake) && releaseRef.current) {
      releaseRef.current()
      releaseRef.current = null
    }
    return () => {
      releaseRef.current?.()
      releaseRef.current = null
    }
  }, [timer.running, keepAwake])

  const startPreset = (seconds: number) => {
    setLastSeconds(seconds)
    setFinished(false)
    timer.start(seconds)
  }

  const idle = timer.totalMs === 0

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Timer" subtitle="Für Tees ohne Anleitung" onBack={onBack} />

      <div className="scroll-area flex-1 px-gutter">
        <div className="flex flex-col items-center pt-6">
          <TimerRing
            seconds={timer.remainingSeconds}
            progress={timer.progress}
            running={timer.running}
            label={
              finished
                ? overdueLabel(timer.overdueSeconds)
                : timer.running
                  ? 'läuft'
                  : idle
                    ? 'Zeit wählen'
                    : 'pausiert'
            }
          />
          <p className="sr-only" aria-live="polite">
            {finished ? overdueLabel(timer.overdueSeconds) : ''}
          </p>

          <div className="mt-6 flex items-center gap-2">
            <Button
              tone="secondary"
              onClick={() => timer.addSeconds(-15)}
              disabled={idle || timer.remainingSeconds <= 15}
            >
              −15 s
            </Button>
            {idle ? (
              <Button icon="start" onClick={() => startPreset(lastSeconds)}>
                {duration(lastSeconds)} starten
              </Button>
            ) : (
              <Button
                icon={timer.running ? 'pause' : 'start'}
                onClick={timer.remainingSeconds === 0 ? () => startPreset(lastSeconds) : timer.toggle}
              >
                {timer.remainingSeconds === 0 ? 'Neu starten' : timer.running ? 'Pause' : 'Weiter'}
              </Button>
            )}
            <Button tone="secondary" onClick={() => timer.addSeconds(15)} disabled={idle}>
              +15 s
            </Button>
          </div>

          {!idle && (
            <button
              type="button"
              onClick={() => {
                timer.reset()
                setFinished(false)
              }}
              className="pressable-subtle mt-3 flex min-h-[44px] items-center gap-1.5 text-footnote text-ink-3"
            >
              <Icon name="kreuz" size={14} />
              Zurücksetzen
            </button>
          )}
        </div>

        <section className="mt-9 pb-10">
          <SectionLabel>Häufige Ziehzeiten</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((seconds) => (
              <button
                key={seconds}
                type="button"
                onClick={() => startPreset(seconds)}
                className={cn(
                  'pressable tnum min-h-[52px] rounded-lg border text-footnote font-semibold',
                  timer.totalMs === seconds * 1000
                    ? 'border-accent bg-accent/8 text-accent'
                    : 'border-line bg-surface text-ink'
                )}
              >
                {duration(seconds)}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
