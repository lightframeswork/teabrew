/**
 * Kranich als Wasserzeichen.
 *
 * Der Kranich steht in der Teekultur für ein langes Leben und taucht in der
 * Bibliothek selbst auf: Ippodos Gyokuro „Kakurei“ heißt übersetzt
 * „Langlebigkeit des Kranichs“. Das Motiv ist also im Inhalt begründet und
 * nicht bloß Dekoration.
 *
 * Bewusst nur eine Zeichnung, keine Dauerbewegung: Der Kopfbereich der
 * Sammlung ist der Bildschirm, den man am häufigsten sieht. Alles, was sich
 * dort ständig regt, nervt ab dem dritten Mal.
 */
export function Crane({ className, size = 190 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 200 120"
      width={size}
      height={(size / 200) * 120}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {/* Schnabel, Hals, Rücken */}
      <path d="M4 40 L18 36 C36 34 58 42 78 52 C96 60 112 60 126 56" />
      {/* Schwanz und Bauchlinie zurück zum Hals */}
      <path d="M126 56 C136 53 144 48 152 42 C150 54 143 62 132 66 C114 72 92 72 74 64 C56 56 34 46 18 42" />
      <path d="M18 42 L4 40" />
      <circle cx="20" cy="39" r="1.5" fill="currentColor" stroke="none" />
      {/* Flügelpaar */}
      <path d="M100 60 C104 38 118 20 142 8" />
      <path d="M100 60 C110 42 126 28 148 18" />
      {/* Beine schleppen nach hinten – ohne sie liest sich der Vogel nicht als Kranich */}
      <path d="M126 66 C146 74 166 82 186 88" />
      <path d="M120 68 C140 78 159 87 178 95" />
      <path d="M186 88 L194 86" />
      <path d="M178 95 L186 95" />
    </svg>
  )
}
