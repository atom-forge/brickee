# TODO

Tervezett munka, fontossági sorrendben. A részletek és az ötletek a `notes/` mappában vannak; a szabályok az `AGENTS.md`-ben.

1. **Tesztek:** nincs test script és tesztkészlet. Elsőként a markdown oda-vissza alakítás (`fromMarkdown` / `toMarkdown` / `toStored` / `fromStored`), a séma (`blocksSchemaFor`) és a pluginok `markdown` alakja.
2. **Az alap pluginok külön csomagba?** Most a `./plugins` belépési pont elég (ami nincs importálva, nem kerül a buildbe); ha a pluginoknak saját függőségük lesz, érdemes leválasztani.
3. **Bemutatóoldal publikálása:** a `src/routes` oldal statikusan buildelhető (`build/`), de még nincs deploy és domain (az `@atom-forge/ui`-é a `deploy/` + `bun run deploy`). A kódnézőben a `svelte-highlight` `langtag.css` importja dev alatt 404-et ad.
