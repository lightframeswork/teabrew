import type { BrewStep, BrewingSpec, MatchaStyle, Tea, VesselId } from '../types'
import { VESSELS, inAkkusativ, vessel } from '../data/vessels'
import { celsius, duration, grams, ml, spokenDuration } from './format'

/**
 * Zubereitung wird berechnet, nicht gespeichert.
 *
 * Die Bibliothek hinterlegt je Tee nur Parameter (Gefäß, Menge, Temperatur,
 * Ziehzeit). Sobald jemand ein anderes Gefäß oder eine andere Größe wählt,
 * werden Menge und Wassermenge neu skaliert und die Schrittanleitung neu
 * formuliert. So gibt es keine Sätze, in denen noch alte Zahlen oder ein
 * falsches Gefäß stehen.
 */

/**
 * Die Zubereitung, die für diesen Tee gilt: die eigene, falls eine gemerkt
 * wurde, sonst die aus der Bibliothek.
 */
export function effectiveBrewing(tea: Tea): BrewingSpec {
  return tea.brewingOverride ?? tea.brewing
}

/** Weicht die gemerkte Zubereitung überhaupt von der Bibliothek ab? */
export function hasOwnBrewing(tea: Tea): boolean {
  return tea.brewingOverride !== undefined
}

export interface BrewPlan {
  vessel: VesselId
  waterMl: number
  teaGrams: number
  temperatureC: number
  steepSeconds: number
  /** Empfohlene Menge, bevor die Obergrenze greift. */
  suggestedGrams: number
  /** true, wenn die Empfehlung durch die Obergrenze gekappt wurde. */
  capped: boolean
  steps: BrewStep[]
  resteeps: BrewingSpec['resteeps']
}

/**
 * Blattmenge skaliert nicht linear mit dem Volumen: Ein doppelt so großes
 * Gefäß braucht weniger als die doppelte Menge, weil das Verhältnis von
 * Blatt zu Wasser bei großen Aufgüssen effizienter wird. Exponent 0,65 bildet
 * das gut ab und entspricht der Praxis in den Herstellerangaben.
 */
const SCALING_EXPONENT = 0.65

/** Obergrenze, damit die Empfehlung bei sehr großen Kannen realistisch bleibt. */
function maxGramsFor(temperatureC: number): number {
  return temperatureC <= 60 ? 16 : 14
}

export function scaleBrewing(
  spec: BrewingSpec,
  targetMl: number,
  overrideGrams?: number
): { teaGrams: number; suggestedGrams: number; waterMl: number; capped: boolean } {
  const ratio = Math.pow(targetMl / spec.vesselSizeMl, SCALING_EXPONENT)
  const suggested = Math.round(spec.teaGrams * ratio * 2) / 2
  const limit = maxGramsFor(spec.temperatureC)
  const capped = suggested > limit
  const teaGrams = overrideGrams ?? Math.min(suggested, limit)
  return {
    teaGrams,
    suggestedGrams: suggested,
    waterMl: Math.round(targetMl / 5) * 5,
    capped,
  }
}

interface StepInput {
  vesselId: VesselId
  waterMl: number
  teaGrams: number
  temperatureC: number
  steepSeconds: number
  preheatVessel: boolean
  preheatCups: boolean
  rinse: boolean
}

function leafSteps(input: StepInput): BrewStep[] {
  const v = vessel(input.vesselId)
  const intoVessel = inAkkusativ(input.vesselId)
  const steps: BrewStep[] = []

  steps.push({
    kind: 'heat',
    title: 'Wasser erhitzen',
    description: `Erhitze ${ml(input.waterMl)} Wasser auf ${celsius(input.temperatureC)}.`,
    seconds: null,
    hint:
      input.temperatureC <= 70
        ? 'Kochendes Wasser kurz abkühlen lassen oder kaltes Wasser zugießen – zu heiß macht diesen Tee bitter.'
        : undefined,
  })

  if (input.preheatVessel || input.preheatCups) {
    const what =
      input.preheatVessel && input.preheatCups
        ? `${v.artikel} ${v.label} und die Tassen`
        : input.preheatVessel
          ? `${v.artikel} ${v.label}`
          : 'die Tassen'
    steps.push({
      kind: 'preheat',
      title: 'Geschirr vorwärmen',
      description: `Spüle ${what} mit heißem Wasser aus und gieße das Wasser weg.`,
      seconds: null,
      hint: 'Ein kaltes Gefäß zieht dem Aufguss sofort Temperatur ab.',
    })
  }

  steps.push({
    kind: 'dose',
    title: 'Tee einlegen',
    description: `Gib ${grams(input.teaGrams)} Teeblätter ${intoVessel}.`,
    seconds: null,
  })

  if (input.rinse) {
    steps.push({
      kind: 'rinse',
      title: 'Blätter wecken',
      description: `Übergieße die Blätter kurz, gieße das Wasser sofort wieder ab und wirf es weg.`,
      seconds: 5,
      hint: 'Der Waschaufguss wird nicht getrunken. Er löst Staub und öffnet gerollte Blätter.',
    })
  }

  steps.push({
    kind: 'pour',
    title: 'Wasser aufgießen',
    description: `Gieße das Wasser (${celsius(input.temperatureC)}) über die Blätter.`,
    seconds: null,
    hint: 'Am Rand entlang gießen, nicht mittig auf die Blätter.',
  })

  steps.push({
    kind: 'steep',
    title: 'Ziehen lassen',
    description: `Lass den Tee ${spokenDuration(input.steepSeconds)} ziehen.`,
    seconds: input.steepSeconds,
  })

  steps.push({
    kind: 'serve',
    title: 'Ausgießen',
    description:
      input.vesselId === 'tasse'
        ? 'Nimm die Blätter heraus oder seihe den Tee ab – sonst zieht er weiter.'
        : 'Gieße vollständig aus, bis zum letzten Tropfen.',
    seconds: null,
    hint:
      input.vesselId === 'tasse'
        ? undefined
        : 'Restwasser im Gefäß macht den nächsten Aufguss bitter.',
  })

  return steps
}

function coldBrewSteps(tea: Tea, waterMl: number, teaGrams: number): BrewStep[] {
  const hours =
    tea.category === 'gruentee' || tea.category === 'weisser-tee'
      ? '4 bis 6'
      : tea.category === 'oolong'
        ? '6 bis 8'
        : '8 bis 12'

  return [
    {
      kind: 'dose',
      title: 'Tee einlegen',
      description: `Gib ${grams(teaGrams)} Teeblätter in einen Krug oder ein verschließbares Glas.`,
      seconds: null,
      hint: 'Für den Kaltaufguss darf es etwas mehr Blatt sein als für den heißen Aufguss.',
    },
    {
      kind: 'pour',
      title: 'Kaltes Wasser zugeben',
      description: `Gieße ${ml(waterMl)} kaltes Wasser über die Blätter.`,
      seconds: null,
      hint: 'Gefiltertes Wasser schmeckt deutlich klarer als hartes Leitungswasser.',
    },
    {
      kind: 'chill',
      title: 'Abdecken und kalt stellen',
      description: 'Decke das Gefäß ab und stelle es in den Kühlschrank.',
      seconds: null,
    },
    {
      kind: 'steep',
      title: 'Ziehen lassen',
      description: `Lass den Tee ${hours} Stunden im Kühlschrank ziehen. Über Nacht ist am einfachsten.`,
      seconds: 8 * 3600,
      hint: 'Der Timer läuft hier nur mit, wenn die App offen bleibt. Ein Wecker ist die verlässlichere Wahl.',
    },
    {
      kind: 'strain',
      title: 'Abseihen',
      description: 'Gieße den Tee durch ein feines Sieb ab und entferne alle Blätter.',
      seconds: null,
    },
    {
      kind: 'enjoy',
      title: 'Servieren',
      description: 'Pur aus dem Kühlschrank oder über Eis. Hält sich zwei bis drei Tage.',
      seconds: null,
    },
  ]
}

export interface MatchaPreset {
  id: MatchaStyle
  label: string
  subtitle: string
  matchaGrams: number
  waterMl: number
  temperatureC: number
}

export const MATCHA_PRESETS: MatchaPreset[] = [
  {
    id: 'usucha',
    label: 'Usucha',
    subtitle: 'Dünner Tee – die alltägliche Schale',
    matchaGrams: 2,
    waterMl: 70,
    temperatureC: 80,
  },
  {
    id: 'koicha',
    label: 'Koicha',
    subtitle: 'Dicker Tee – zeremoniell, sirupartig',
    matchaGrams: 4,
    waterMl: 30,
    temperatureC: 80,
  },
  {
    id: 'latte',
    label: 'Matcha Latte',
    subtitle: 'Mit aufgeschäumter Milch',
    matchaGrams: 3,
    waterMl: 50,
    temperatureC: 80,
  },
]

export function matchaPreset(style: MatchaStyle): MatchaPreset {
  return MATCHA_PRESETS.find((p) => p.id === style) ?? MATCHA_PRESETS[0]
}

function matchaSteps(style: MatchaStyle): BrewStep[] {
  const preset = matchaPreset(style)
  const common: BrewStep[] = [
    {
      kind: 'preheat',
      title: 'Schale vorwärmen',
      description:
        'Spüle die Chawan mit heißem Wasser aus, gieße das Wasser weg und trockne sie ab.',
      seconds: null,
      hint: 'In einer feuchten Schale klumpt das Pulver.',
    },
    {
      kind: 'sift',
      title: 'Matcha sieben',
      description: `Siebe ${grams(preset.matchaGrams)} Matcha in die trockene Schale.`,
      seconds: null,
      hint: 'Sieben ist der einzige zuverlässige Weg gegen Klümpchen.',
    },
  ]

  if (style === 'usucha') {
    return [
      ...common,
      {
        kind: 'pour',
        title: 'Wasser zugeben',
        description: `Gieße ${ml(preset.waterMl)} Wasser mit ${celsius(preset.temperatureC)} vorsichtig auf das Pulver.`,
        seconds: null,
      },
      {
        kind: 'whisk',
        title: 'Chasen anfeuchten',
        description: 'Tauche die Spitzen des Bambusbesens kurz in heißes Wasser.',
        seconds: null,
        hint: 'Angefeuchtete Spitzen brechen nicht so leicht.',
      },
      {
        kind: 'whisk',
        title: 'Aufschlagen',
        description:
          'Halte den Chasen senkrecht und schlage zügig in W-Bewegungen auf, bis eine feinporige Schaumdecke steht.',
        seconds: 20,
        hint: 'W-Bewegungen aus dem Handgelenk – nicht im Kreis rühren.',
      },
      {
        kind: 'enjoy',
        title: 'Trinken',
        description: 'Usucha wird in drei bis vier Zügen getrunken, solange der Schaum steht.',
        seconds: null,
      },
    ]
  }

  if (style === 'koicha') {
    return [
      ...common,
      {
        kind: 'pour',
        title: 'Wasser zugeben',
        description: `Gieße nur ${ml(preset.waterMl)} Wasser mit ${celsius(preset.temperatureC)} auf das Pulver.`,
        seconds: null,
        hint: 'Die geringe Wassermenge ergibt die sirupartige Textur.',
      },
      {
        kind: 'whisk',
        title: 'Chasen anfeuchten',
        description: 'Tauche den Bambusbesen kurz in heißes Wasser.',
        seconds: null,
      },
      {
        kind: 'whisk',
        title: 'Einrühren',
        description:
          'Rühre langsam und kreisend, drücke den Chasen dabei sanft gegen den Schalenboden.',
        seconds: 30,
        hint: 'Koicha wird nicht aufgeschlagen. Geduld statt Tempo.',
      },
      {
        kind: 'enjoy',
        title: 'Trinken',
        description: 'Koicha wird in zwei bis drei Zügen getrunken. Sehr dicht, sehr viel Umami.',
        seconds: null,
      },
    ]
  }

  return [
    {
      kind: 'sift',
      title: 'Matcha sieben',
      description: `Siebe ${grams(preset.matchaGrams)} Matcha in eine große Tasse.`,
      seconds: null,
    },
    {
      kind: 'pour',
      title: 'Heißes Wasser zugeben',
      description: `Gieße ${ml(preset.waterMl)} Wasser mit ${celsius(preset.temperatureC)} dazu.`,
      seconds: null,
    },
    {
      kind: 'whisk',
      title: 'Glatt rühren',
      description: 'Schlage den Matcha auf, bis keine Klümpchen mehr zu sehen sind.',
      seconds: null,
    },
    {
      kind: 'milk',
      title: 'Milch erwärmen',
      description: 'Erwärme 150 ml Milch auf etwa 65 °C und schäume sie auf. Nicht kochen.',
      seconds: null,
      hint: 'Hafermilch mit Barista-Anteil schäumt am zuverlässigsten.',
    },
    {
      kind: 'pour',
      title: 'Milch aufgießen',
      description: 'Gieße die warme Milch langsam über den Matcha.',
      seconds: null,
    },
    {
      kind: 'enjoy',
      title: 'Trinken',
      description: 'Kurz umrühren und trinken.',
      seconds: null,
    },
  ]
}

export function buildPlan(
  tea: Tea,
  options: {
    vesselId: VesselId
    sizeMl: number
    overrideGrams?: number
    matcha?: MatchaStyle
    /** Feinjustierung; ohne Angabe gilt der Wert des Tees. */
    temperatureC?: number
    steepSeconds?: number
  }
): BrewPlan {
  const base = effectiveBrewing(tea)
  const temperatureC = options.temperatureC ?? base.temperatureC
  const steepSeconds = options.steepSeconds ?? base.steepSeconds
  if (tea.category === 'matcha') {
    const preset = matchaPreset(options.matcha ?? 'usucha')
    return {
      vessel: 'tasse',
      waterMl: preset.waterMl,
      teaGrams: preset.matchaGrams,
      temperatureC: preset.temperatureC,
      steepSeconds: 0,
      suggestedGrams: preset.matchaGrams,
      capped: false,
      steps: matchaSteps(preset.id),
      resteeps: null,
    }
  }

  const scaled = scaleBrewing(base, options.sizeMl, options.overrideGrams)

  if (options.vesselId === 'kaltaufguss') {
    const coldGrams = options.overrideGrams ?? Math.round(scaled.teaGrams * 1.5 * 2) / 2
    return {
      vessel: 'kaltaufguss',
      waterMl: scaled.waterMl,
      teaGrams: coldGrams,
      temperatureC: 8,
      steepSeconds: 8 * 3600,
      suggestedGrams: coldGrams,
      capped: false,
      steps: coldBrewSteps(tea, scaled.waterMl, coldGrams),
      resteeps: null,
    }
  }

  const steps = leafSteps({
    vesselId: options.vesselId,
    waterMl: scaled.waterMl,
    teaGrams: scaled.teaGrams,
    temperatureC,
    steepSeconds,
    preheatVessel: base.preheatVessel,
    preheatCups: base.preheatCups,
    rinse: base.rinse,
  })

  return {
    vessel: options.vesselId,
    waterMl: scaled.waterMl,
    teaGrams: scaled.teaGrams,
    temperatureC,
    steepSeconds,
    suggestedGrams: scaled.suggestedGrams,
    capped: scaled.capped,
    steps,
    resteeps: base.resteeps,
  }
}

/** Ziehzeit und Temperatur für den n-ten Aufguss (n = 0 ist der erste). */
export function infusionParams(plan: BrewPlan, index: number) {
  if (index === 0 || !plan.resteeps) {
    return { seconds: plan.steepSeconds, temperatureC: plan.temperatureC }
  }
  return {
    seconds: plan.steepSeconds + index * plan.resteeps.addSeconds,
    temperatureC: Math.min(100, plan.temperatureC + index * plan.resteeps.addTemperatureC),
  }
}

/** „2. Aufguss: 1:15 min bei 85 °C“ – ein Satz statt einer Formel. */
export function resteepSummary(plan: BrewPlan): string | null {
  if (!plan.resteeps) return null
  const total = plan.resteeps.max + 1
  const last = infusionParams(plan, plan.resteeps.max)
  if (plan.resteeps.max === 1) {
    return `Ein zweiter Aufguss lohnt sich: ${duration(last.seconds)} bei ${celsius(last.temperatureC)}.`
  }
  return `Bis zu ${total} Aufgüsse. Jeder weitere zieht ${plan.resteeps.addSeconds} Sekunden länger und verträgt ${plan.resteeps.addTemperatureC} °C mehr.`
}

/** Kurzbeschreibung der gewählten Methode – landet so auch im Journal. */
export function methodLabel(
  tea: Tea,
  vesselId: VesselId,
  sizeMl: number,
  matcha?: MatchaStyle
): string {
  if (tea.category === 'matcha') return `Matcha · ${matchaPreset(matcha ?? 'usucha').label}`
  if (vesselId === 'kaltaufguss') return `Kaltaufguss · ${ml(sizeMl)}`
  return `${VESSELS[vesselId].label} · ${ml(sizeMl)}`
}
