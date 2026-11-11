# TODO

Tervezett munka, fontossági sorrendben. A részletek és az ötletek a `notes/` mappában vannak; a szabályok az `AGENTS.md`-ben.

1. **Kódátnézés javításai:** a pluginváltozások visszavonása, a vágólap saját formátuma, a tárolt alak gyorsítótára, majd a nagyobb fejlesztések. Megállapítások és részletes terv: [notes/2026-11-11-kodatnezes-es-javitasi-terv.md](notes/2026-11-11-kodatnezes-es-javitasi-terv.md).
2. **További tesztek:** a markdown-átalakításnak van tesztje (`src/lib/markdown.test.ts`); hiányzik a séma (`blocksSchemaFor`), a pluginok `markdown` alakja és a szerkesztő beillesztése.
3. **Az alap pluginok külön csomagba?** Most a `./plugins` belépési pont elég (ami nincs importálva, nem kerül a buildbe); ha a pluginoknak saját függőségük lesz, érdemes leválasztani.
4. **Bemutatóoldal publikálása:** a `src/routes` oldal statikusan buildelhető (`build/`), de még nincs deploy és domain (az `@atom-forge/ui`-é a `deploy/` + `bun run deploy`). A kódnézőben a `svelte-highlight` `langtag.css` importja dev alatt 404-et ad.
