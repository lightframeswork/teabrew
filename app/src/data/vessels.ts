import type { Vessel, VesselId } from '../types'

/**
 * Gefäße samt grammatischem Geschlecht. Die Zubereitungsschritte werden aus
 * diesen Angaben gebildet, damit Sätze wie „Gieße das Wasser in die Kyusu“
 * unabhängig vom gewählten Gefäß korrekt sind.
 */
export const VESSELS: Record<VesselId, Vessel> = {
  kyusu: {
    id: 'kyusu',
    label: 'Kyusu',
    artikel: 'die',
    akkusativ: 'die',
    dativ: 'der',
    genus: 'f',
    plural: 'Kyusu',
    subtitle: 'Japanische Kanne mit Seitengriff',
    hint: 'Das feine Sieb hält auch tief gedämpften Sencha zurück.',
  },
  gaiwan: {
    id: 'gaiwan',
    label: 'Gaiwan',
    artikel: 'der',
    akkusativ: 'den',
    dativ: 'dem',
    genus: 'm',
    plural: 'Gaiwan',
    subtitle: 'Chinesische Deckelschale',
    hint: 'Kurze Aufgüsse, viele Wiederholungen – der Klassiker für Oolong.',
  },
  teekanne: {
    id: 'teekanne',
    label: 'Teekanne',
    artikel: 'die',
    akkusativ: 'die',
    dativ: 'der',
    genus: 'f',
    plural: 'Teekannen',
    subtitle: 'Westliche Kanne mit Sieb',
    hint: 'Für größere Mengen und lange Ziehzeiten.',
  },
  tasse: {
    id: 'tasse',
    label: 'Tasse',
    artikel: 'die',
    akkusativ: 'die',
    dativ: 'der',
    genus: 'f',
    plural: 'Tassen',
    subtitle: 'Direkt in der Tasse aufgießen',
    hint: 'Blätter am Ende abseihen, sonst zieht der Tee weiter.',
  },
  filter: {
    id: 'filter',
    label: 'Filter',
    artikel: 'der',
    akkusativ: 'den',
    dativ: 'dem',
    genus: 'm',
    plural: 'Filter',
    subtitle: 'Handfilter oder Teesieb',
    hint: 'Blätter brauchen Platz – kein zu enges Sieb verwenden.',
  },
  kaltaufguss: {
    id: 'kaltaufguss',
    label: 'Krug',
    artikel: 'der',
    akkusativ: 'den',
    dativ: 'dem',
    genus: 'm',
    plural: 'Krüge',
    subtitle: 'Über Nacht im Kühlschrank',
    hint: 'Kalt gezogen bleibt der Tee mild und praktisch bitterstofffrei.',
  },
}

/** Reihenfolge in Auswahllisten. */
export const VESSEL_ORDER: VesselId[] = [
  'kyusu',
  'gaiwan',
  'teekanne',
  'tasse',
  'filter',
  'kaltaufguss',
]

/** Gefäße, die für den ersten Einrichtungsschritt angeboten werden. */
export const ONBOARDING_VESSELS: VesselId[] = ['kyusu', 'gaiwan', 'teekanne', 'tasse', 'filter']

export const VESSEL_SIZES = [60, 80, 100, 120, 150, 180, 200, 250, 300] as const

export const VESSEL_SIZE_LABEL: Record<number, string> = {
  60: 'Sehr klein · 1 Schale',
  80: 'Klein · 1 Tasse',
  100: 'Kompakt · 1–2 Tassen',
  120: 'Standard · 2 Tassen',
  150: 'Mittel · 2–3 Tassen',
  180: 'Groß · 3 Tassen',
  200: 'Sehr groß · 3–4 Tassen',
  250: 'XL · 4 Tassen',
  300: 'XXL · 4–5 Tassen',
}

export function vessel(id: VesselId): Vessel {
  return VESSELS[id] ?? VESSELS.teekanne
}

/** „in die Kyusu“, „in den Gaiwan“, „in das Glas“. */
export function inAkkusativ(id: VesselId): string {
  const v = vessel(id)
  return `in ${v.akkusativ} ${v.label}`
}

/** „aus der Kyusu“, „aus dem Gaiwan“. */
export function ausDativ(id: VesselId): string {
  const v = vessel(id)
  return `aus ${v.dativ} ${v.label}`
}
