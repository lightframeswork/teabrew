import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStore } from './store/useStore'
import { configureFeedback } from './lib/feedback'
import type { CategoryId, JournalEntry } from './types'
import { TabBar, ToastStack, type TabId } from './components/Shell'
import { Onboarding } from './screens/Onboarding'
import { Collection } from './screens/Collection'
import { CategoryList } from './screens/CategoryList'
import { TeaDetail } from './screens/TeaDetail'
import { Brew } from './screens/Brew'
import { QuickTimer } from './screens/QuickTimer'
import { Journal } from './screens/Journal'
import { Library } from './screens/Library'
import { CustomTea } from './screens/CustomTea'
import { Settings } from './screens/Settings'
import { SearchOverlay } from './screens/SearchOverlay'

type Route =
  | { name: 'sammlung' }
  | { name: 'kategorie'; category: CategoryId }
  | { name: 'tee'; teaId: string }
  | { name: 'zubereiten'; teaId: string }
  | { name: 'timer' }
  | { name: 'journal' }
  | { name: 'entdecken' }
  | { name: 'eigenerTee'; editId?: string }
  | { name: 'einstellungen' }

const ROOTS: Record<TabId, Route> = {
  sammlung: { name: 'sammlung' },
  journal: { name: 'journal' },
  entdecken: { name: 'entdecken' },
  einstellungen: { name: 'einstellungen' },
}

export function App() {
  const onboarded = useStore((state) => state.onboarded)
  const theme = useStore((state) => state.settings.theme)
  const sound = useStore((state) => state.settings.sound)
  const haptics = useStore((state) => state.settings.haptics)
  const addJournalEntry = useStore((state) => state.addJournalEntry)

  const [tab, setTab] = useState<TabId>('sammlung')
  const [stacks, setStacks] = useState<Record<TabId, Route[]>>(() => ({
    sammlung: [ROOTS.sammlung],
    journal: [ROOTS.journal],
    entdecken: [ROOTS.entdecken],
    einstellungen: [ROOTS.einstellungen],
  }))
  const [searchOpen, setSearchOpen] = useState(false)

  /* Erscheinungsbild ------------------------------------------------- */
  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches)
      root.dataset.theme = dark ? 'dark' : 'light'
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? '#161310' : '#F7F3EB')
    }

    apply()
    if (theme !== 'system') return
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])

  useEffect(() => {
    configureFeedback({ sound, haptics })
  }, [sound, haptics])

  /* Navigation ------------------------------------------------------- */
  const stack = stacks[tab]
  const route = stack[stack.length - 1]
  const canGoBack = stack.length > 1

  const push = useCallback(
    (next: Route) => setStacks((current) => ({ ...current, [tab]: [...current[tab], next] })),
    [tab]
  )

  const pop = useCallback(
    () =>
      setStacks((current) => {
        const list = current[tab]
        if (list.length <= 1) return current
        return { ...current, [tab]: list.slice(0, -1) }
      }),
    [tab]
  )

  const selectTab = useCallback((next: TabId) => {
    setSearchOpen(false)
    setTab((previous) => {
      // Erneutes Tippen auf den aktiven Reiter führt zurück zur Wurzel –
      // das erwartet man von einer Tableiste.
      if (previous === next) {
        setStacks((current) => ({ ...current, [next]: [ROOTS[next]] }))
      }
      return next
    })
  }, [])

  const openTea = useCallback((teaId: string) => push({ name: 'tee', teaId }), [push])
  const openLibrary = useCallback(() => selectTab('entdecken'), [selectTab])

  /* Hardware-/Browser-Zurück ---------------------------------------- */
  useEffect(() => {
    if (!canGoBack && !searchOpen) return
    history.pushState({ chado: true }, '')
    const onPop = () => {
      if (searchOpen) setSearchOpen(false)
      else pop()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [canGoBack, searchOpen, pop])

  /* Tastatur --------------------------------------------------------- */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (event.key === '/' && !searchOpen) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [searchOpen])

  const finishBrewing = useCallback(
    (entry?: Omit<JournalEntry, 'id'>) => {
      if (entry) {
        addJournalEntry(entry)
        setStacks((current) => ({ ...current, sammlung: [ROOTS.sammlung], journal: [ROOTS.journal] }))
        setTab('journal')
        return
      }
      pop()
    },
    [addJournalEntry, pop]
  )

  const screen = useMemo(() => {
    switch (route.name) {
      case 'sammlung':
        return (
          <Collection
            onOpenSearch={() => setSearchOpen(true)}
            onOpenCategory={(category) => push({ name: 'kategorie', category })}
            onOpenTea={openTea}
            onOpenLibrary={openLibrary}
            onOpenTimer={() => push({ name: 'timer' })}
          />
        )
      case 'kategorie':
        return <CategoryList categoryId={route.category} onBack={pop} onOpenTea={openTea} />
      case 'tee':
        return (
          <TeaDetail
            teaId={route.teaId}
            onBack={pop}
            onBrew={(id) => push({ name: 'zubereiten', teaId: id })}
            onEdit={(id) => push({ name: 'eigenerTee', editId: id })}
          />
        )
      case 'zubereiten':
        return <Brew teaId={route.teaId} onBack={pop} onFinish={finishBrewing} />
      case 'timer':
        return <QuickTimer onBack={pop} />
      case 'journal':
        return <Journal onOpenLibrary={openLibrary} onOpenTea={openTea} />
      case 'entdecken':
        return <Library onOpenTea={openTea} onCreateOwn={() => push({ name: 'eigenerTee' })} />
      case 'eigenerTee':
        return (
          <CustomTea
            editId={route.editId}
            onBack={pop}
            onSaved={(id) => {
              setStacks((current) => ({
                ...current,
                entdecken: [ROOTS.entdecken],
                sammlung: [ROOTS.sammlung, { name: 'tee', teaId: id }],
              }))
              setTab('sammlung')
            }}
          />
        )
      case 'einstellungen':
        return <Settings />
      default:
        return null
    }
  }, [route, push, pop, openTea, openLibrary, finishBrewing])

  if (!onboarded) {
    return (
      <div className="flex h-full justify-center bg-canvas">
        <div className="relative h-full w-full max-w-md overflow-hidden">
          <Onboarding onDone={() => setTab('sammlung')} />
        </div>
      </div>
    )
  }

  /** Zubereitung läuft ohne Tableiste – ein Weg, keine Ablenkung. */
  const immersive = route.name === 'zubereiten'

  return (
    <div className="flex h-full justify-center bg-canvas">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-canvas">
        <a href="#inhalt" className="skip-link">
          Zum Inhalt springen
        </a>
        <main
          id="inhalt"
          key={`${tab}-${stack.length}-${route.name}`}
          className={
            canGoBack
              ? 'anim-push relative flex-1 overflow-hidden'
              : 'anim-fade relative flex-1 overflow-hidden'
          }
        >
          {screen}
        </main>

        {!immersive && <TabBar active={tab} onSelect={selectTab} />}

        {searchOpen && (
          <SearchOverlay
            onClose={() => setSearchOpen(false)}
            onOpenTea={openTea}
            onOpenLibraryTea={(id) => {
              setTab('entdecken')
              setStacks((current) => ({
                ...current,
                entdecken: [ROOTS.entdecken, { name: 'tee', teaId: id }],
              }))
            }}
          />
        )}

        <ToastStack />
      </div>
    </div>
  )
}
