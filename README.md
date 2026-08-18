# Chado

Tee-Assistent als installierbare Web-App: Teesammlung verwalten, zu jedem Tee
die passende Zubereitung nachschlagen und Schritt für Schritt aufgießen – mit
Timer für jede Ziehzeit und Vorschlägen für die Folgeaufgüsse.

Die App läuft vollständig auf dem Gerät. Es gibt kein Konto, keinen Server und
keine Netzwerkanfrage nach dem ersten Laden.

## Aufbau des Repositorys

    app/                Quellcode
      index.html        Vorlage (Vite-Einstiegspunkt)
      public/           Manifest, Service Worker, Symbole, Schriftdateien
      src/
        data/           Teebibliothek, Sorten, Gefäße
        lib/            Zubereitungslogik, Formatierung, Timer, Rückmeldung
        store/          Zustand (zustand + localStorage)
        components/     Bausteine der Oberfläche
        screens/        Bildschirme
    index.html          gebaute Fassung – wird von GitHub Pages ausgeliefert
    assets/             gebaute Bundles
    tools/publish.mjs   kopiert dist/ ins Wurzelverzeichnis

Die Trennung ist nötig, weil GitHub Pages diesen Branch direkt aus dem
Wurzelverzeichnis ausliefert. Läge die Vorlage ebenfalls dort, würde der Build
seine eigene Eingabe überschreiben.

## Entwickeln

    npm install
    npm run dev        # Entwicklungsserver
    npm run build      # prüft Typen, baut und veröffentlicht ins Wurzelverzeichnis

Nach `npm run build` gehören `index.html`, `assets/`, `manifest.json`, `sw.js`,
`fonts/` und die Symbole mit in den Commit – sie sind das, was ausgeliefert wird.

## Entwurfsentscheidungen

**Zubereitung wird gerechnet, nicht gespeichert.** Je Tee liegen nur Parameter
vor (Gefäß, Menge, Temperatur, Ziehzeit). Die Schrittanleitung entsteht daraus
zur Laufzeit in `lib/brewing.ts`. Wählt jemand ein anderes Gefäß oder eine
andere Menge, werden Blattmenge und Wassermenge neu skaliert und die Sätze neu
gebildet – inklusive korrektem Artikel („in die Kyusu“, „in den Gaiwan“). Das
ersetzt die frühere Textersetzung in fertigen Sätzen, bei der Zahlen und
Gefäßnamen auseinanderlaufen konnten.

**Zahlen und Einheiten an einer Stelle.** `lib/format.ts` setzt Dezimalkomma,
schmales geschütztes Leerzeichen vor der Einheit und Halbgeviertstrich in
Bereichen durch. Alle Messwerte laufen darüber.

**Timer über Zeitstempel.** `lib/useTimer.ts` merkt sich den Zielzeitpunkt statt
Ticks zu zählen. Wird die App in den Hintergrund geschoben und gedrosselt,
stimmt die Anzeige beim Zurückkommen trotzdem. Während der Zubereitung hält ein
Wake Lock den Bildschirm an.

**Farben als Token.** Alle Farben stehen als CSS-Variablen in `src/index.css`,
einmal für Papier und einmal für Sumi (dunkel). Jede Textstufe erfüllt für sich
WCAG AA; `prefers-reduced-motion`, `prefers-reduced-transparency` und
`prefers-contrast` sind berücksichtigt.

**Eigener Symbolsatz.** `components/Icon.tsx` enthält den kompletten Satz als
Inline-SVG. Kyusu, Chawan und Chasen kommen in keiner Icon-Bibliothek vor, und
ein eigener Satz spart zugleich eine Abhängigkeit.

**Schrift im Projekt.** Fraunces liegt als woff2 in `app/public/fonts` statt
über einen Font-Dienst geladen zu werden – so startet die App auch offline mit
der richtigen Schrift.

## Daten aus älteren Fassungen

Beim ersten Start übernimmt `migrateLegacyStorage()` Sammlung, Journal,
Favoriten und Einstellungen aus dem alten Speicherschlüssel `chado-storage`.
Tees aus der Bibliothek werden dabei gegen die aktuelle Fassung getauscht,
persönliche Notizen bleiben erhalten. Der alte Schlüssel wird nicht gelöscht.
