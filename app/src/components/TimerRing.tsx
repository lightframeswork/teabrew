import { clock } from '../lib/format'
import { cn } from '../lib/cn'

/**
 * Der Ring füllt sich, statt zu leeren: Fortschritt wächst auf das Ziel zu.
 * Die Zahl darin ist die eigentliche Information, der Ring nur die Peripherie
 * – deshalb ist er dünn und farblich zurückhaltend.
 */
export function TimerRing({
  seconds,
  progress,
  running,
  size = 232,
  label,
}: {
  seconds: number
  progress: number
  running: boolean
  size?: number
  label?: string
}) {
  const stroke = 5
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(1, Math.max(0, progress))

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--line))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--accent))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 220ms linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <output
          aria-live="off"
          className={cn(
            'tnum font-display text-[3.4rem] leading-none tracking-tight text-ink',
            !running && seconds > 0 && 'text-ink-2'
          )}
        >
          {clock(seconds)}
        </output>
        {label && <span className="mt-2 text-caption text-ink-3">{label}</span>}
      </div>
    </div>
  )
}
