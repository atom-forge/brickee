# TODO

Tervezett munka, fontossági sorrendben. A részletek és az ötletek a `notes/` mappában vannak; a szabályok az `AGENTS.md`-ben.

1. **Mikro popupok z-indexe:** a formázósáv és a slash/Átalakítás menü egy ui-ablakban (modal) az ablak mögé kerül; tegyük őket az `@atom-forge/ui` popup-rétegébe, mint a link- és az inline-űrlapot. Részletek: [notes/2026-11-11-mikro-popupok-z-index.md](notes/2026-11-11-mikro-popupok-z-index.md).
2. **További tesztek:** van teszt a markdown-, a HTML-átalakításra és a szerveroldali renderelésre; hiányzik a séma (`blocksSchemaFor`), a pluginok `markdown` alakja, és a szerkesztő viselkedése (beillesztés, visszavonás, húzás — most a `notes/` tervéhez írt Playwright-próbák és a `scripts/shots.mjs` fedik, CI-ban nem futnak).
3. **Az alap pluginok külön csomagba?** Most a `./plugins` belépési pont elég (ami nincs importálva, nem kerül a buildbe); ha a pluginoknak saját függőségük lesz, érdemes leválasztani.
4. **Kódnéző dev-hiba:** a bemutatóoldal kódnézőjében a `svelte-highlight` `langtag.css` importja dev alatt 404-et ad.
5. **Érintőképernyős húzás:** a blokkok húzása HTML5 drag-gel megy; eszközön nem próbáltuk. Ha nem megbízható, pointer-alapú húzás (a tábla sor/oszlop húzása a minta). Addig a „Mozgatás fel/le” menüpont pótolja.
6. **Több saját plugin példa a bemutatóoldalon:** a gomb, a doboz és a saját mezőűrlapos fotó mellé további minták (pl. nézetenkénti érték saját `form`-mal és az alkalmazás kontextusával, egy galéria, egy alkalmazásadatból dolgozó blokk).
