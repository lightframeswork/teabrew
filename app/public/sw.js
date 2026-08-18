/**
 * Service Worker für Chado.
 *
 * Strategie:
 *  - Navigationsanfragen: zuerst Netz, bei Ausfall die zwischengespeicherte
 *    Startseite. So sieht man nach einem Update sofort die neue Fassung und
 *    offline trotzdem etwas.
 *  - Statische Bausteine (Skript, Stil, Bild, Schrift): zuerst Cache, sonst
 *    Netz. Die Dateinamen enthalten einen Hash, alte Einträge werden beim
 *    Versionswechsel gelöscht.
 */

const VERSION = 'chado-v2'
const BASE = self.location.pathname.replace(/\/[^/]*$/, '/') || '/'
const SHELL = [
  BASE,
  `${BASE}index.html`,
  `${BASE}manifest.json`,
  `${BASE}icon-192.png`,
  `${BASE}icon-512.png`,
  `${BASE}fonts/fraunces-latin.woff2`,
  `${BASE}fonts/fraunces-latin-ext.woff2`,
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => name !== VERSION).map((name) => caches.delete(name)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  if (!request.url.startsWith(self.location.origin)) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(VERSION).then((cache) => cache.put(`${BASE}index.html`, copy))
          return response
        })
        .catch(() => caches.match(`${BASE}index.html`).then((cached) => cached ?? Response.error()))
    )
    return
  }

  const cacheable = ['script', 'style', 'image', 'font'].includes(request.destination)
  if (!cacheable) return

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response.status === 200 && response.type === 'basic') {
          const copy = response.clone()
          caches.open(VERSION).then((cache) => cache.put(request, copy))
        }
        return response
      })
    })
  )
})
