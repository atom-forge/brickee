# TODO

Tervezett munka, fontossági sorrendben. A részletek és az ötletek a `notes/` mappában vannak; a szabályok az `AGENTS.md`-ben.

1. **Tesztek:** nincs test script és tesztkészlet. Elsőként a markdown oda-vissza alakítás (`fromMarkdown` / `toMarkdown` / `toStored` / `fromStored`), a séma (`blocksSchemaFor`) és a pluginok `markdown` alakja.
2. **Bemutatóoldal (`src/routes/`):** `bun run dev` alatt egy szerkesztő + előnézet a csomag pluginjaival. Kell hozzá az `@atom-forge/ui` témája (Tailwind).
3. **Kiadás előkészítése:** git remote (`atom-forge/brickee`), első commit, `ship-it init` (npm Trusted Publisher). A `@atom-forge/ship` most `file:../ship` — a workflow ezért külön checkoutolja.
4. **Az alap pluginok külön csomagba?** Most a `./plugins` belépési pont elég (ami nincs importálva, nem kerül a buildbe); ha a pluginoknak saját függőségük lesz, érdemes leválasztani.
