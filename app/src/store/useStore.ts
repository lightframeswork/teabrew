import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BrewingSpec, JournalEntry, Settings, Tea, Toast } from '../types'
import { libraryTea } from '../data/teas'

const DEFAULT_SETTINGS: Settings = {
  userName: '',
  defaultVessel: 'kyusu',
  defaultVesselSizeMl: 120,
  theme: 'system',
  haptics: true,
  sound: true,
  keepAwake: true,
}

interface State {
  collection: Tea[]
  journal: JournalEntry[]
  favorites: string[]
  settings: Settings
  onboarded: boolean
  toasts: Toast[]

  addTea: (tea: Tea) => boolean
  removeTea: (id: string) => void
  clearCollection: () => void
  updateNotes: (id: string, notes: string) => void
  updateTea: (tea: Tea) => void
  setBrewingOverride: (id: string, spec: BrewingSpec | null) => void
  toggleFavorite: (id: string) => void

  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void
  updateJournalEntry: (entry: JournalEntry) => void
  removeJournalEntry: (id: string) => void

  updateSettings: (patch: Partial<Settings>) => void
  completeOnboarding: () => void
  replaceAll: (data: { collection: Tea[]; journal: JournalEntry[]; favorites: string[]; settings: Partial<Settings> }) => void

  toast: (tone: Toast['tone'], message: string) => void
  dismissToast: (id: string) => void
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.round(Math.random() * 1e6)}`
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      collection: [],
      journal: [],
      favorites: [],
      settings: DEFAULT_SETTINGS,
      onboarded: false,
      toasts: [],

      addTea: (tea) => {
        if (get().collection.some((t) => t.id === tea.id)) return false
        set({
          collection: [...get().collection, { ...tea, addedDate: new Date().toISOString() }],
        })
        return true
      },

      removeTea: (id) =>
        set({
          collection: get().collection.filter((t) => t.id !== id),
          favorites: get().favorites.filter((f) => f !== id),
        }),

      clearCollection: () => set({ collection: [], favorites: [] }),

      updateNotes: (id, notes) =>
        set({
          collection: get().collection.map((t) =>
            t.id === id ? { ...t, personalNotes: notes } : t
          ),
        }),

      updateTea: (tea) =>
        set({ collection: get().collection.map((t) => (t.id === tea.id ? tea : t)) }),

      setBrewingOverride: (id, spec) =>
        set({
          collection: get().collection.map((t) =>
            t.id === id ? { ...t, brewingOverride: spec ?? undefined } : t
          ),
        }),

      toggleFavorite: (id) => {
        const favorites = get().favorites
        set({
          favorites: favorites.includes(id)
            ? favorites.filter((f) => f !== id)
            : [...favorites, id],
        })
      },

      addJournalEntry: (entry) =>
        set({ journal: [{ ...entry, id: newId() }, ...get().journal] }),

      updateJournalEntry: (entry) =>
        set({ journal: get().journal.map((e) => (e.id === entry.id ? entry : e)) }),

      removeJournalEntry: (id) => set({ journal: get().journal.filter((e) => e.id !== id) }),

      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),

      completeOnboarding: () => set({ onboarded: true }),

      // Wird nur beim Einspielen einer Sicherung benutzt. Einstellungen werden
      // über die Vorgaben gelegt, damit eine ältere Sicherung keine Felder
      // löscht, die es damals noch nicht gab.
      replaceAll: ({ collection, journal, favorites, settings }) =>
        set({
          collection,
          journal,
          favorites,
          settings: { ...DEFAULT_SETTINGS, ...get().settings, ...settings },
          onboarded: true,
        }),

      toast: (tone, message) => {
        const id = newId()
        set({ toasts: [...get().toasts.slice(-1), { id, tone, message }] })
        window.setTimeout(() => get().dismissToast(id), 2600)
      },

      dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
    }),
    {
      name: 'chado-v2',
      version: 2,
      partialize: (state) => ({
        collection: state.collection,
        journal: state.journal,
        favorites: state.favorites,
        settings: state.settings,
        onboarded: state.onboarded,
      }),
    }
  )
)

/**
 * Sammlung, Journal und Einstellungen aus der ersten App-Version übernehmen.
 * Läuft genau einmal und lässt den alten Schlüssel unangetastet, damit bei
 * einem Fehler nichts verloren geht.
 */
export function migrateLegacyStorage() {
  try {
    if (localStorage.getItem('chado-v2-migrated') === 'true') return
    const raw = localStorage.getItem('chado-storage')
    localStorage.setItem('chado-v2-migrated', 'true')
    if (!raw) return

    interface LegacyTea {
      id?: string
      name?: string
      brand?: string
      personalNotes?: string
      addedDate?: string
    }
    interface LegacyEntry {
      teaId?: string
      teaName?: string
      teaBrand?: string
      date?: string
      brewingMethod?: string
      rating?: number
      notes?: string
    }

    const parsed = JSON.parse(raw) as {
      state?: {
        collection?: LegacyTea[]
        journal?: LegacyEntry[]
        favorites?: string[]
        settings?: { userName?: string; defaultVesselType?: string; defaultVesselSizeMl?: number }
        onboardingComplete?: boolean
      }
    }
    const legacy = parsed.state
    if (!legacy) return

    const store = useStore.getState()
    const vesselMap: Record<string, Settings['defaultVessel']> = {
      kyusu: 'kyusu',
      gaiwan: 'gaiwan',
      teekanne: 'teekanne',
      glas: 'tasse',
      filter: 'filter',
      coldbrew: 'kaltaufguss',
    }

    store.updateSettings({
      userName: legacy.settings?.userName ?? '',
      defaultVessel: vesselMap[legacy.settings?.defaultVesselType ?? 'kyusu'] ?? 'kyusu',
      defaultVesselSizeMl: legacy.settings?.defaultVesselSizeMl ?? 120,
    })

    // Tees aus der Bibliothek werden gegen die aktuelle, deutschsprachige
    // Fassung getauscht. Persönliche Notizen bleiben erhalten.
    const collection: Tea[] = []
    for (const item of legacy.collection ?? []) {
      if (!item?.id) continue
      const current = libraryTea(item.id)
      if (!current) continue
      collection.push({
        ...current,
        addedDate: item.addedDate || new Date().toISOString(),
        personalNotes: item.personalNotes || undefined,
      })
    }

    const journal: JournalEntry[] = (legacy.journal ?? [])
      .filter((e) => e?.teaName)
      .map((e) => ({
        id: newId(),
        teaId: e.teaId ?? '',
        teaName: e.teaName ?? '',
        teaBrand: e.teaBrand ?? '',
        date: e.date ?? new Date().toISOString(),
        method: e.brewingMethod ?? '',
        infusions: 1,
        rating: typeof e.rating === 'number' ? e.rating : 0,
        notes: e.notes ?? '',
      }))

    useStore.setState({
      collection,
      journal,
      favorites: Array.isArray(legacy.favorites) ? legacy.favorites : [],
    })

    if (legacy.onboardingComplete || localStorage.getItem('chado-onboarded') === 'true') {
      store.completeOnboarding()
    }
  } catch {
    /* Ein defekter Altbestand darf den Start nicht verhindern. */
  }
}
