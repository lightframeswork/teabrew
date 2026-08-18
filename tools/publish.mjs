/**
 * Kopiert das Build-Ergebnis aus dist/ in das Repository-Wurzelverzeichnis.
 *
 * GitHub Pages liefert diesen Branch direkt aus dem Wurzelverzeichnis aus.
 * Der Quellcode liegt daneben in app/ – deshalb wird gezielt kopiert statt
 * das ganze Verzeichnis zu ersetzen.
 *
 * Nebenbei bekommt der Service Worker die Namen der gehashten Bundles. Ohne
 * sie könnte er sie nicht vorab ablegen, und die App wäre beim ersten
 * Offline-Start ohne Skript und Stylesheet.
 */
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

async function exists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

if (!(await exists(dist))) {
  console.error('dist/ fehlt – zuerst „vite build“ ausführen.')
  process.exit(1)
}

// Gehashte Bundles aus der gebauten index.html lesen.
const html = await readFile(join(dist, 'index.html'), 'utf8')
const assets = [...html.matchAll(/(?:src|href)="[^"]*?(assets\/[^"]+)"/g)].map((m) => m[1])
if (assets.length === 0) {
  console.error('Keine Bundles in dist/index.html gefunden – Build unvollständig?')
  process.exit(1)
}

// Der Cache-Name enthält den Hash des Skripts: Ein neuer Build räumt beim
// Aktivieren automatisch den alten Cache ab.
const buildId = `chado-${assets.find((a) => a.endsWith('.js'))?.match(/-([\w-]+)\.js$/)?.[1] ?? 'dev'}`

const swPath = join(dist, 'sw.js')
if (await exists(swPath)) {
  const sw = await readFile(swPath, 'utf8')
  await writeFile(
    swPath,
    sw
      .replace('__BUILD_ID__', buildId)
      .replace('__BUILD_ASSETS__', JSON.stringify(assets)),
    'utf8'
  )
} else {
  console.error('dist/sw.js fehlt – public/sw.js prüfen.')
  process.exit(1)
}

// Alte, gehashte Bundles entfernen, damit keine Leichen liegen bleiben.
await rm(join(root, 'assets'), { recursive: true, force: true })
await mkdir(join(root, 'assets'), { recursive: true })

for (const entry of await readdir(dist, { withFileTypes: true })) {
  await cp(join(dist, entry.name), join(root, entry.name), { recursive: true, force: true })
}

console.log(`Build ins Wurzelverzeichnis übernommen (${buildId}, ${assets.length} Bundles).`)
