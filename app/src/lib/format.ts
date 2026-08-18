/**
 * Deutsche Schreibweisen an einer Stelle.
 *
 * Regeln, die hier durchgesetzt werden:
 *  - Dezimaltrennzeichen ist das Komma (2,5 – nicht 2.5).
 *  - Zwischen Zahl und Einheit steht ein schmales geschütztes Leerzeichen,
 *    damit „3 g“ nie umbricht (DIN 5008).
 *  - Vor „°C“ steht ebenfalls ein Leerzeichen (80 °C).
 *  - Zahlenbereiche werden mit Halbgeviertstrich gesetzt (4–6), ohne Spatien.
 */

/** Schmales geschütztes Leerzeichen. */
const NNBSP = ' '
/** Geschütztes Leerzeichen. */
export const NBSP = ' '

export function decimal(value: number, maxFractionDigits = 1): string {
  return new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: 0,
  }).format(value)
}

export function grams(value: number): string {
  return `${decimal(value)}${NNBSP}g`
}

export function ml(value: number): string {
  return `${decimal(value, 0)}${NNBSP}ml`
}

export function celsius(value: number): string {
  return `${decimal(value, 0)}${NNBSP}°C`
}

export function range(from: number, to: number, unit?: string): string {
  const body = `${decimal(from)}–${decimal(to)}`
  return unit ? `${body}${NNBSP}${unit}` : body
}

/** Kurzform für Listen und Chips: 40 s, 1:30, 12:00. */
export function duration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}${NNBSP}s`
  if (totalSeconds >= 3600 && totalSeconds % 3600 === 0) {
    return `${totalSeconds / 3600}${NNBSP}h`
  }
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (seconds === 0) return `${minutes}${NNBSP}min`
  return `${minutes}:${String(seconds).padStart(2, '0')}${NNBSP}min`
}

/** Uhrwerkform für den laufenden Timer: 02:30. */
export function clock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/** Gesprochene Ziehzeit für Fließtext: „40 Sekunden“, „1 Minute 30 Sekunden“. */
export function spokenDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds} Sekunden`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const minutePart = minutes === 1 ? 'eine Minute' : `${decimal(minutes, 0)} Minuten`
  if (seconds === 0) return minutePart
  return `${minutePart} und ${decimal(seconds, 0)} Sekunden`
}

export function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many
}

export function infusionLabel(count: number): string {
  return `${decimal(count, 0)} ${plural(count, 'Aufguss', 'Aufgüsse')}`
}

const DATE_FULL = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const TIME_SHORT = new Intl.DateTimeFormat('de-DE', {
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return DATE_FULL.format(date)
}

export function formatTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${TIME_SHORT.format(date)}${NBSP}Uhr`
}

/** „Heute“, „Gestern“, sonst das Datum. */
export function formatDayLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayDelta = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000)
  if (dayDelta === 0) return 'Heute'
  if (dayDelta === 1) return 'Gestern'
  if (dayDelta === 2) return 'Vorgestern'
  return DATE_FULL.format(date)
}

/**
 * Wie lange der Tee schon fertig steht. Wichtiger Fall: Man legt das Telefon
 * weg, die Seite wird eingefroren, und beim Zurückkommen soll nicht so getan
 * werden, als sei gerade eben abgeläutet worden.
 */
export function overdueLabel(seconds: number): string {
  if (seconds < 45) return 'Fertig'
  if (seconds < 90) return 'Seit einer Minute fertig'
  if (seconds < 3600) return `Seit ${Math.round(seconds / 60)} Minuten fertig`
  const hours = Math.floor(seconds / 3600)
  return hours === 1 ? 'Seit über einer Stunde fertig' : `Seit ${hours} Stunden fertig`
}

export function greeting(hour: number): string {
  if (hour >= 5 && hour < 11) return 'Guten Morgen'
  if (hour >= 11 && hour < 18) return 'Guten Tag'
  if (hour >= 18 && hour < 23) return 'Guten Abend'
  return 'Gute Nacht'
}

/** Deutsche Anführungszeichen für zitierte Nutzereingaben. */
export function quote(text: string): string {
  return `„${text}“`
}
