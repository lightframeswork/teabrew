export type CategoryId =
  | 'gruentee'
  | 'schwarztee'
  | 'oolong'
  | 'puerh'
  | 'weisser-tee'
  | 'gelber-tee'
  | 'matcha'
  | 'anderer'

export type VesselId = 'kyusu' | 'gaiwan' | 'teekanne' | 'tasse' | 'filter' | 'kaltaufguss'

/** Grammatisches Geschlecht – damit Sätze wie „in die Kyusu“ korrekt entstehen. */
export type Genus = 'm' | 'f' | 'n'

export interface Vessel {
  id: VesselId
  /** Nominativ ohne Artikel, z. B. „Kyusu“. */
  label: string
  /** Bestimmter Artikel im Nominativ: der/die/das. */
  artikel: string
  /** Bestimmter Artikel im Akkusativ: den/die/das. */
  akkusativ: string
  /** Bestimmter Artikel im Dativ: dem/der/dem. */
  dativ: string
  genus: Genus
  /** Plural des Gefäßnamens, z. B. „Gaiwan“ → „Gaiwan“. */
  plural: string
  subtitle: string
  hint: string
}

export type CaffeineLevel = 'keins' | 'wenig' | 'mittel' | 'viel'

export const CAFFEINE_LABEL: Record<CaffeineLevel, string> = {
  keins: 'koffeinfrei',
  wenig: 'wenig Koffein',
  mittel: 'mittlerer Koffeingehalt',
  viel: 'viel Koffein',
}

export interface Resteeps {
  /** Anzahl der Aufgüsse nach dem ersten. */
  max: number
  /** Zusätzliche Ziehzeit je Folgeaufguss in Sekunden. */
  addSeconds: number
  /** Temperaturanpassung je Folgeaufguss in °C. */
  addTemperatureC: number
}

export interface BrewingSpec {
  vessel: VesselId
  vesselSizeMl: number
  teaGrams: number
  temperatureC: number
  /** Ziehzeit des ersten Aufgusses in Sekunden. */
  steepSeconds: number
  preheatVessel: boolean
  preheatCups: boolean
  /** Kurzer Waschaufguss vor dem ersten richtigen Aufguss. */
  rinse: boolean
  resteeps: Resteeps | null
}

export interface Tea {
  id: string
  name: string
  /** Originalschreibweise, z. B. 玉露. */
  nameOriginal?: string
  brand: string
  category: CategoryId
  /** Deutsche Sortenbezeichnung, z. B. „Beschatteter Grüntee“. */
  variety: string
  /** Traditioneller Teename, z. B. „Gyokuro“. */
  tradition: string
  origin: string
  originDetail: string
  description: string
  /** Koffeingehalt in der fertigen Tasse. */
  caffeine: CaffeineLevel
  tags: string[]
  brewing: BrewingSpec
  /** Nur bei selbst angelegten Tees gesetzt. */
  custom?: boolean
  addedDate?: string
  personalNotes?: string
  vendor?: string
  price?: number
  harvest?: string
  packageGrams?: number
  remainingGrams?: number
}

export type MatchaStyle = 'usucha' | 'koicha' | 'latte'

export type StepKind =
  | 'heat'
  | 'preheat'
  | 'dose'
  | 'rinse'
  | 'pour'
  | 'steep'
  | 'serve'
  | 'sift'
  | 'whisk'
  | 'milk'
  | 'enjoy'
  | 'chill'
  | 'strain'

export interface BrewStep {
  kind: StepKind
  title: string
  description: string
  /** Ziehzeit in Sekunden; null, wenn der Schritt nicht getaktet ist. */
  seconds: number | null
  hint?: string
}

export interface JournalEntry {
  id: string
  teaId: string
  teaName: string
  teaBrand: string
  /** ISO-Zeitstempel. */
  date: string
  method: string
  infusions: number
  rating: number
  notes: string
}

export type ThemeMode = 'system' | 'light' | 'dark'

export interface Settings {
  userName: string
  defaultVessel: VesselId
  defaultVesselSizeMl: number
  theme: ThemeMode
  haptics: boolean
  sound: boolean
  keepAwake: boolean
}

export interface Toast {
  id: string
  tone: 'info' | 'success' | 'danger'
  message: string
}
