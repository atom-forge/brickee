# TODO

Tervezett munka, fontossági sorrendben. A részletek és az ötletek a `notes/` mappában vannak; a szabályok az `AGENTS.md`-ben.

1. **Képletek és inline pluginok:** blokk-képlet (`math`, Temml/MathML, `@atom-forge/brickee/math`, `$$…$$`), majd egy általános inline plugin bővítési pont, és rá az inline képlet (`$…$`, GitHub/Obsidian-szabály). Terv: [notes/2026-11-11-inline-pluginok-es-kepletek.md](notes/2026-11-11-inline-pluginok-es-kepletek.md).
2. **További tesztek:** van teszt a markdown-, a HTML-átalakításra és a szerveroldali renderelésre; hiányzik a séma (`blocksSchemaFor`), a pluginok `markdown` alakja, és a szerkesztő viselkedése (beillesztés, visszavonás, húzás — most a `notes/` tervéhez írt Playwright-próbák és a `scripts/shots.mjs` fedik, CI-ban nem futnak).
3. **Az alap pluginok külön csomagba?** Most a `./plugins` belépési pont elég (ami nincs importálva, nem kerül a buildbe); ha a pluginoknak saját függőségük lesz, érdemes leválasztani.
4. **Bemutatóoldal publikálása:** a `src/routes` oldal statikusan buildelhető (`build/`), de még nincs deploy és domain (az `@atom-forge/ui`-é a `deploy/` + `bun run deploy`). A kódnézőben a `svelte-highlight` `langtag.css` importja dev alatt 404-et ad.
5. **Érintőképernyős húzás:** a blokkok húzása HTML5 drag-gel megy; eszközön nem próbáltuk. Ha nem megbízható, pointer-alapú húzás (a tábla sor/oszlop húzása a minta). Addig a „Mozgatás fel/le” menüpont pótolja.
