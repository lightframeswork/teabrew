/**
 * Rückmeldung über mehrere Sinne.
 *
 * Regel: Bild, Ton und Vibration werden im selben Tick ausgelöst. Alles, was
 * hier passiert, ist an ein tatsächliches Ereignis gebunden (Schritt fertig,
 * Timer abgelaufen) – nie an bloßes Antippen. Zu viel Feedback trainiert
 * Leute darauf, es zu ignorieren.
 */

let enabledHaptics = true
let enabledSound = true

export function configureFeedback(options: { haptics: boolean; sound: boolean }) {
  enabledHaptics = options.haptics
  enabledSound = options.sound
}

function vibrate(pattern: number | number[]) {
  if (!enabledHaptics) return
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  try {
    navigator.vibrate(pattern)
  } catch {
    /* Vibration ist überall optional. */
  }
}

let audioContext: AudioContext | null = null

function context(): AudioContext | null {
  if (!enabledSound) return null
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!audioContext) audioContext = new Ctor()
  if (audioContext.state === 'suspended') void audioContext.resume()
  return audioContext
}

/**
 * Ein kurzer Glockenton statt eines Weckerpiepsens: Sinuston mit schnellem
 * Anschlag und langem Ausklang, damit er in einen ruhigen Raum passt.
 */
function bell(frequency: number, duration: number, delay = 0, gain = 0.22) {
  const ctx = context()
  if (!ctx) return
  const start = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(frequency, start)
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(amp).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

/** Der Timer ist abgelaufen – das wichtigste Signal der App. */
export function signalDone() {
  bell(880, 1.6)
  bell(1318.5, 1.9, 0.14, 0.16)
  vibrate([90, 80, 90, 80, 200])
}

/** Ein Schritt wurde abgehakt. */
export function signalStep() {
  bell(660, 0.5, 0, 0.1)
  vibrate(18)
}

/**
 * Einmaliges Vorspielen beim Einschalten in den Einstellungen. Läuft bewusst
 * an der Einstellung vorbei: Man schaltet den Ton ein und will genau in dem
 * Moment hören, worauf man sich einlässt.
 */
export function previewSound() {
  const wasEnabled = enabledSound
  enabledSound = true
  bell(880, 1.1)
  bell(1318.5, 1.3, 0.14, 0.13)
  enabledSound = wasEnabled
}

/** Etwas ist schiefgelaufen oder wurde gelöscht. */
export function signalWarn() {
  bell(320, 0.5, 0, 0.14)
  vibrate([30, 50, 30])
}

/**
 * Der Bildschirm soll während des Ziehens an bleiben. Ohne das schaltet sich
 * das Display mitten in der Zubereitung ab – der häufigste Grund, warum ein
 * Timer übersehen wird.
 */
export function requestWakeLock(): () => void {
  const nav = navigator as Navigator & {
    wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> }
  }
  if (!nav.wakeLock) return () => {}

  let sentinel: { release(): Promise<void> } | null = null
  let released = false

  const acquire = async () => {
    try {
      const lock = await nav.wakeLock!.request('screen')
      if (released) {
        void lock.release()
        return
      }
      sentinel = lock
    } catch {
      /* Verweigert der Browser den Lock, läuft alles wie bisher weiter. */
    }
  }

  const onVisibility = () => {
    if (document.visibilityState === 'visible' && !released) void acquire()
  }

  void acquire()
  document.addEventListener('visibilitychange', onVisibility)

  return () => {
    released = true
    document.removeEventListener('visibilitychange', onVisibility)
    void sentinel?.release().catch(() => {})
    sentinel = null
  }
}
