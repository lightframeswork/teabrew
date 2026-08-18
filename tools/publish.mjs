/**
 * Kopiert das Build-Ergebnis aus dist/ in das Repository-Wurzelverzeichnis.
 *
 * GitHub Pages liefert diesen Branch direkt aus dem Wurzelverzeichnis aus.
 * Der Quellcode liegt daneben in src/ – deshalb wird gezielt kopiert statt
 * das ganze Verzeichnis zu ersetzen.
 */
import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises'
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

// Alte, gehashte Bundles entfernen, damit keine Leichen liegen bleiben.
await rm(join(root, 'assets'), { recursive: true, force: true })
await mkdir(join(root, 'assets'), { recursive: true })

for (const entry of await readdir(dist, { withFileTypes: true })) {
  const from = join(dist, entry.name)
  const to = join(root, entry.name)
  await cp(from, to, { recursive: true, force: true })
}

console.log('Build ins Wurzelverzeichnis übernommen.')
