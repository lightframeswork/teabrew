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
  /** Wie lange die Zeit schon abgelaufen ist. */
  const [overdueMs, setOverdueMs] = useState(0)

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
    setOverdueMs(0)
    setRunning(ms > 0)
  }, [])

  const reset = useCallback(() => {
    setRunning(false)
    setRemainingMs(0)
    setTotalMs(0)
    setOverdueMs(0)
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
        setOverdueMs(-left)
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

  // iOS friert die Seite im Hintergrund ein. Kommt sie zurück, wird sofort
  // nachgerechnet – sonst behauptet die Anzeige, es liefe noch etwas.
  useEffect(() => {
    const sync = () => {
      if (document.visibilityState !== 'visible') return
      if (deadlineRef.current === 0) return
      const left = deadlineRef.current - Date.now()
      if (left <= 0) setOverdueMs(-left)
    }
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('focus', sync)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('focus', sync)
    }
  }, [])

  // Solange die Zeit abgelaufen ist und niemand neu startet, läuft die
  // Nachlaufanzeige minütlich mit.
  useEffect(() => {
    if (overdueMs <= 0 || running) return
    const id = window.setInterval(() => {
      if (deadlineRef.current === 0) return
      setOverdueMs(Math.max(0, Date.now() - deadlineRef.current))
    }, 10_000)
    return () => window.clearInterval(id)
  }, [overdueMs, running])

  const remainingSeconds = Math.ceil(remainingMs / 1000)
  const overdueSeconds = Math.floor(overdueMs / 1000)
  const progress = totalMs > 0 ? 1 - remainingMs / totalMs : 0

  return {
    remainingSeconds,
    remainingMs,
    overdueSeconds,
    totalMs,
    running,
    progress,
    start,
    stop,
    toggle,
    reset,
    addSeconds,
  }
}
