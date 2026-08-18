import type { JournalEntry, Settings, Tea } from '../types'

/**
 * Sicherung als JSON-Datei.
 *
 * Alles liegt im lokalen Speicher des Browsers. Räumt jemand die Website-Daten
 * auf oder wechselt das Gerät, ist die Sammlung weg – ohne Vorwarnung. Diese
 * Datei ist der einzige Weg, das zu überleben.
 */

export const BACKUP_FORMAT = 'chado-sicherung'
export const BACKUP_VERSION = 1

export interface Backup {
  format: typeof BACKUP_FORMAT
  version: number
  createdAt: string
  collection: Tea[]
  journal: JournalEntry[]
  favorites: string[]
  settings: Settings
}

export function buildBackup(data: Omit<Backup, 'format' | 'version' | 'createdAt'>): Backup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    ...data,
  }
}

export function backupFileName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `chado-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`
}

export type ShareResult = 'geteilt' | 'geladen' | 'abgebrochen'

/**
 * iOS bietet im installierten Web-App-Modus keinen brauchbaren Download an –
 * dort führt das Teilen-Blatt zum Ziel. Auf dem Rechner ist der Download
 * richtig. Deshalb erst teilen versuchen, dann herunterladen.
 */
export async function shareBackup(backup: Backup): Promise<ShareResult> {
  const json = JSON.stringify(backup, null, 2)
  const name = backupFileName()

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    typeof navigator.share === 'function'

  if (canShareFiles) {
    try {
      const file = new File([json], name, { type: 'application/json' })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Chado-Sicherung' })
        return 'geteilt'
      }
    } catch (error) {
      // Bricht jemand das Teilen-Blatt ab, ist das kein Fehler.
      if (error instanceof DOMException && error.name === 'AbortError') return 'abgebrochen'
    }
  }

  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'geladen'
}

export class BackupError extends Error {}

/** Prüft eine eingelesene Datei, bevor irgendetwas ersetzt wird. */
export function parseBackup(text: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new BackupError('Die Datei ist keine gültige JSON-Datei.')
  }

  if (typeof data !== 'object' || data === null) {
    throw new BackupError('Die Datei hat nicht den erwarteten Aufbau.')
  }

  const candidate = data as Partial<Backup>

  if (candidate.format !== BACKUP_FORMAT) {
    throw new BackupError('Das ist keine Chado-Sicherung.')
  }
  if (typeof candidate.version !== 'number' || candidate.version > BACKUP_VERSION) {
    throw new BackupError('Die Sicherung stammt aus einer neueren Version von Chado.')
  }
  if (!Array.isArray(candidate.collection) || !Array.isArray(candidate.journal)) {
    throw new BackupError('In der Sicherung fehlen Sammlung oder Journal.')
  }

  // Nur Einträge übernehmen, die auch benutzbar sind – eine halb kaputte
  // Sicherung soll die App nicht mit in den Abgrund reißen.
  const collection = candidate.collection.filter(
    (tea): tea is Tea =>
      typeof tea === 'object' &&
      tea !== null &&
      typeof (tea as Tea).id === 'string' &&
      typeof (tea as Tea).name === 'string' &&
      typeof (tea as Tea).brewing === 'object'
  )
  const journal = candidate.journal.filter(
    (entry): entry is JournalEntry =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as JournalEntry).id === 'string' &&
      typeof (entry as JournalEntry).teaName === 'string'
  )

  return {
    format: BACKUP_FORMAT,
    version: candidate.version,
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : '',
    collection,
    journal,
    favorites: Array.isArray(candidate.favorites)
      ? candidate.favorites.filter((id): id is string => typeof id === 'string')
      : [],
    settings: (candidate.settings ?? {}) as Settings,
  }
}
