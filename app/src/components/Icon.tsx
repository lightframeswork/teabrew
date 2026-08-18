import type { SVGProps } from 'react'

/**
 * Hauseigener Symbolsatz.
 *
 * Alle Zeichen sind auf demselben 24er-Raster gebaut, mit gleicher Strichstärke
 * und runden Enden. Der Satz ersetzt eine Icon-Bibliothek, weil ein Teeutensil
 * wie Kyusu, Chawan oder Chasen dort schlicht nicht vorkommt – und weil ein
 * eigener Satz der App ein Gesicht gibt.
 */

export type IconName =
  | 'blatt'
  | 'kanne'
  | 'schale'
  | 'besen'
  | 'kessel'
  | 'thermometer'
  | 'sanduhr'
  | 'buch'
  | 'kompass'
  | 'regler'
  | 'lupe'
  | 'plus'
  | 'minus'
  | 'zurueck'
  | 'weiter'
  | 'hoch'
  | 'runter'
  | 'haken'
  | 'kreuz'
  | 'stern'
  | 'herz'
  | 'papierkorb'
  | 'stift'
  | 'wiederholen'
  | 'pause'
  | 'start'
  | 'sonne'
  | 'mond'
  | 'tropfen'
  | 'waage'
  | 'info'
  | 'warnung'

const PATHS: Record<IconName, JSX.Element> = {
  blatt: (
    <>
      <path d="M20 4c0 8.5-4.6 13-11.2 13H5.2C5.2 9.4 10.4 4 20 4Z" />
      <path d="M4 21c1.8-5.6 5-9.5 9.6-11.8" />
    </>
  ),
  kanne: (
    <>
      <path d="M4.6 10h11.2a1 1 0 0 1 1 1.1l-.5 4.6A4 4 0 0 1 12.3 19H8.1a4 4 0 0 1-4-3.3l-.5-4.6A1 1 0 0 1 4.6 10Z" />
      <path d="M17 11.6c1.6 0 2.7.7 3.4 2.1" />
      <path d="M3.5 10 1.7 7.6" />
      <path d="M8 7.4c0-1 .8-1.6 2-1.6s2-.6 2-1.6" />
    </>
  ),
  schale: (
    <>
      <path d="M3.2 10.5h17.6l-1.1 4.4A6 6 0 0 1 13.9 19h-3.8a6 6 0 0 1-5.8-4.1Z" />
      <path d="M8.6 7.3c.6-.7.6-1.6 0-2.3" />
      <path d="M12.4 7c.6-.9.6-2 0-2.9" />
      <path d="M16 7.3c.6-.7.6-1.6 0-2.3" />
    </>
  ),
  besen: (
    <>
      <path d="M9.5 3.6h5v5.2h-5z" />
      <path d="M8 8.8h8l-.7 5.4a3.4 3.4 0 0 1-3.3 3 3.4 3.4 0 0 1-3.3-3Z" />
      <path d="M9.9 9v7.8M12 9v8.2M14.1 9v7.8" />
      <path d="M10.8 20.4h2.4" />
    </>
  ),
  kessel: (
    <>
      <path d="M5 11.2h13a1 1 0 0 1 1 1.1l-.4 3.5A4 4 0 0 1 14.6 19H8.4a4 4 0 0 1-4-3.2L4 12.3a1 1 0 0 1 1-1.1Z" />
      <path d="M8.6 11.2V9.4a2.9 2.9 0 0 1 5.8 0v1.8" />
      <path d="M11.5 6.4V3.4" />
      <path d="M19 13.4c1.5.3 2.4 1.2 2.4 2.4" />
    </>
  ),
  thermometer: (
    <>
      <path d="M13.8 13.6V4.6a1.9 1.9 0 0 0-3.8 0v9a4 4 0 1 0 3.8 0Z" />
      <path d="M11.9 9.4h2.6M11.9 6.6h2" />
    </>
  ),
  sanduhr: (
    <>
      <path d="M6.5 3h11M6.5 21h11" />
      <path d="M7.5 3v3.1c0 2.2 4.5 3.9 4.5 5.9s-4.5 3.7-4.5 5.9V21" />
      <path d="M16.5 3v3.1c0 2.2-4.5 3.9-4.5 5.9s4.5 3.7 4.5 5.9V21" />
    </>
  ),
  buch: (
    <>
      <path d="M4 4.6h5.2A2.8 2.8 0 0 1 12 7.4v12a2.4 2.4 0 0 0-2.4-2.4H4Z" />
      <path d="M20 4.6h-5.2A2.8 2.8 0 0 0 12 7.4v12a2.4 2.4 0 0 1 2.4-2.4H20Z" />
    </>
  ),
  kompass: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m15.2 8.8-1.9 4.5-4.5 1.9 1.9-4.5Z" />
    </>
  ),
  regler: (
    <>
      <path d="M4 7.4h9M17 7.4h3" />
      <path d="M4 16.6h3M11 16.6h9" />
      <circle cx="15" cy="7.4" r="2.1" />
      <circle cx="9" cy="16.6" r="2.1" />
    </>
  ),
  lupe: (
    <>
      <circle cx="10.8" cy="10.8" r="6.4" />
      <path d="m15.6 15.6 4.2 4.2" />
    </>
  ),
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  minus: <path d="M5.5 12h13" />,
  zurueck: (
    <>
      <path d="M19 12H5.6" />
      <path d="m11.4 5.6-6 6.4 6 6.4" />
    </>
  ),
  weiter: (
    <>
      <path d="M5 12h13.4" />
      <path d="m12.6 5.6 6 6.4-6 6.4" />
    </>
  ),
  hoch: <path d="m6 14.5 6-6 6 6" />,
  runter: <path d="m6 9.5 6 6 6-6" />,
  haken: <path d="m5 12.6 4.6 4.6L19 6.4" />,
  kreuz: <path d="M6 6l12 12M18 6 6 18" />,
  stern: (
    <path d="m12 3.6 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9-5.3-2.9-5.3 2.9 1.1-5.9L3.5 9.8l5.9-.8Z" />
  ),
  herz: (
    <path d="M12 20.2S3.8 15.4 3.8 9.6a4.5 4.5 0 0 1 8.2-2.6 4.5 4.5 0 0 1 8.2 2.6c0 5.8-8.2 10.6-8.2 10.6Z" />
  ),
  papierkorb: (
    <>
      <path d="M4.5 6.6h15" />
      <path d="M9.4 6.6V4.8a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4v1.8" />
      <path d="M6.6 6.6 7.5 19a1.8 1.8 0 0 0 1.8 1.6h5.4a1.8 1.8 0 0 0 1.8-1.6l.9-12.4" />
      <path d="M10.4 10.2v6.6M13.6 10.2v6.6" />
    </>
  ),
  stift: (
    <>
      <path d="M4.5 19.5h3.2L18.9 8.3a2.2 2.2 0 0 0-3.2-3.1L4.5 16.4Z" />
      <path d="m14.6 6.4 3.1 3.1" />
    </>
  ),
  wiederholen: (
    <>
      <path d="M4.4 12a7.6 7.6 0 0 1 13-5.4l2.2 2.1" />
      <path d="M19.6 12a7.6 7.6 0 0 1-13 5.4l-2.2-2.1" />
      <path d="M19.9 4.2v4.5h-4.5M4.1 19.8v-4.5h4.5" />
    </>
  ),
  pause: <path d="M9.4 5.4v13.2M14.6 5.4v13.2" />,
  start: <path d="M7.4 4.9 19 12 7.4 19.1Z" />,
  sonne: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.6v2.2M12 19.2v2.2M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.4 19.6 6 18M18 6l1.6-1.6" />
    </>
  ),
  mond: <path d="M20 14.4A8.4 8.4 0 0 1 9.6 4 8.4 8.4 0 1 0 20 14.4Z" />,
  tropfen: <path d="M12 3.4c3.4 4 5.6 6.8 5.6 9.6a5.6 5.6 0 1 1-11.2 0c0-2.8 2.2-5.6 5.6-9.6Z" />,
  waage: (
    <>
      <path d="M12 4.4v15.2" />
      <path d="M6 8.2h12" />
      <path d="M4.2 15.4 7 8.6l2.8 6.8a3 3 0 0 1-5.6 0Z" />
      <path d="M14.2 15.4 17 8.6l2.8 6.8a3 3 0 0 1-5.6 0Z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11v5.4M12 7.9v.2" />
    </>
  ),
  warnung: (
    <>
      <path d="M12 3.8 21 19.6H3Z" />
      <path d="M12 9.8v4.4M12 17.2v.2" />
    </>
  ),
}

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
  strokeWidth?: number
  filled?: boolean
}

export function Icon({ name, size = 22, strokeWidth = 1.6, filled, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
