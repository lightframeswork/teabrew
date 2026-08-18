import type { CategoryId } from '../types'

export interface Category {
  id: CategoryId
  label: string
  /** Genitiv-taugliche Pluralform für Fließtext. */
  plural: string
  /** Ein Satz, der die Sorte greifbar macht – kein Marketing. */
  blurb: string
  /** Blattfarbe der Sorte, in beiden Themes lesbar. */
  hue: string
  hueDark: string
}

export const CATEGORIES: Category[] = [
  {
    id: 'gruentee',
    label: 'Grüntee',
    plural: 'Grüntees',
    blurb: 'Unoxidiert, gedämpft oder geröstet. Mag es kühler, als man denkt.',
    hue: '#5A7247',
    hueDark: '#9CB77F',
  },
  {
    id: 'schwarztee',
    label: 'Schwarztee',
    plural: 'Schwarztees',
    blurb: 'Vollständig oxidiert. Kräftig, malzig, verträgt kochendes Wasser.',
    hue: '#6B4429',
    hueDark: '#C79466',
  },
  {
    id: 'oolong',
    label: 'Oolong',
    plural: 'Oolongs',
    blurb: 'Teiloxidiert. Zwischen Blume und Röstung – und sehr aufgussfreudig.',
    hue: '#9B7B4E',
    hueDark: '#D6B37C',
  },
  {
    id: 'puerh',
    label: 'Pu-Erh',
    plural: 'Pu-Erh-Tees',
    blurb: 'Nachfermentiert und gereift. Erdig, tief, über viele Aufgüsse hinweg.',
    hue: '#5C3D2E',
    hueDark: '#B98D70',
  },
  {
    id: 'weisser-tee',
    label: 'Weißer Tee',
    plural: 'Weiße Tees',
    blurb: 'Kaum bearbeitet, nur gewelkt und getrocknet. Zart und hell.',
    hue: '#A08F63',
    hueDark: '#D9C89A',
  },
  {
    id: 'gelber-tee',
    label: 'Gelber Tee',
    plural: 'Gelbe Tees',
    blurb: 'Selten. Wie Grüntee, aber mit einem sanften Gelbstich-Prozess.',
    hue: '#A9862F',
    hueDark: '#DEBD62',
  },
  {
    id: 'matcha',
    label: 'Matcha',
    plural: 'Matcha',
    blurb: 'Gemahlenes Blatt statt Aufguss. Wird aufgeschlagen, nicht gezogen.',
    hue: '#5F8438',
    hueDark: '#A8CC6E',
  },
  {
    id: 'anderer',
    label: 'Kräuter & Früchte',
    plural: 'Kräuter- und Früchtetees',
    blurb: 'Rooibos, Honeybush, Gewürze, Früchte – ohne Camellia sinensis.',
    hue: '#7A6A5C',
    hueDark: '#B7A797',
  },
]

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]))

export function category(id: CategoryId): Category {
  return BY_ID.get(id) ?? CATEGORIES[CATEGORIES.length - 1]
}
