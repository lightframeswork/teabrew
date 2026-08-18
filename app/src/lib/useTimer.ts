import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Countdown auf Basis von Zeitstempeln, nicht von Tick-Zählern.
 *
 * Ein Intervall, das im Hintergrund gedrosselt wird, verliert Zeit. Deshalb
 * merkt sich der Timer den Zielzeitpunkt und rechnet bei jedem Tick neu –
 * kommt die App aus dem Hintergrund zurück, stimmt die Anzeige sofort.
 */
export function useTimer(onComplete?: () => void) {
  const [remainingMs, setRemainingMs] = useState(0)
  const [totalMs, setTotalMs] = useState(0)
  const [running, setRunning] = useState(false)

  const deadlineRef = useRef(0)
  const frameRef = useRef(0)
  const completeRef = useRef(onComplete)
  completeRef.current = onComplete

  const stop = useCallback(() => {
    setRunning(false)
  }, [])

  const start = useCallback((seconds: number) => {
    const ms = Math.max(0, Math.round(seconds * 1000))
    deadlineRef.current = Date.now() + ms
    setTotalMs(ms)
    setRemainingMs(ms)
    setRunning(ms > 0)
  }, [])

  const reset = useCallback(() => {
    setRunning(false)
    setRemainingMs(0)
    setTotalMs(0)
    deadlineRef.current = 0
  }, [])

  /** Pause hält die Restzeit fest, Fortsetzen setzt einen neuen Zielzeitpunkt. */
  const toggle = useCallback(() => {
    setRunning((wasRunning) => {
      if (wasRunning) {
        setRemainingMs(Math.max(0, deadlineRef.current - Date.now()))
        return false
      }
      deadlineRef.current = Date.now() + remainingMs
      return remainingMs > 0
    })
  }, [remainingMs])

  const addSeconds = useCallback(
    (seconds: number) => {
      const delta = seconds * 1000
      setTotalMs((value) => Math.max(1000, value + delta))
      if (running) {
        deadlineRef.current = Math.max(Date.now(), deadlineRef.current + delta)
        setRemainingMs(Math.max(0, deadlineRef.current - Date.now()))
      } else {
        setRemainingMs((value) => Math.max(0, value + delta))
      }
    },
    [running]
  )

  useEffect(() => {
    if (!running) return
    let cancelled = false

    const tick = () => {
      if (cancelled) return
      const left = deadlineRef.current - Date.now()
      if (left <= 0) {
        setRemainingMs(0)
        setRunning(false)
        completeRef.current?.()
        return
      }
      setRemainingMs(left)
      frameRef.current = window.setTimeout(tick, left < 2000 ? 60 : 200)
    }

    tick()
    return () => {
      cancelled = true
      window.clearTimeout(frameRef.current)
    }
  }, [running])

  const remainingSeconds = Math.ceil(remainingMs / 1000)
  const progress = totalMs > 0 ? 1 - remainingMs / totalMs : 0

  return { remainingSeconds, remainingMs, totalMs, running, progress, start, stop, toggle, reset, addSeconds }
}
