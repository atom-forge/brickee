# A szerveren

[← Előző](host-contexts.md) · [Tartalom](index.md) · [Következő →](recipes-and-pitfalls.md)

A tárolt dokumentum a böngésző által küldött JSON, ezért a szervernek mentés előtt ellenőriznie kell. Két belépési pontnak nincs Svelte-függősége, ezek szerveroldali kódhoz készültek:

- `@atom-forge/brickee/model` — `StoredBlock`, `MD`, `MAX_INDENT`, `MAX_DEPTH`, `isMd`, `acceptsId`, `inlineToPlainText`, `blocksToPlainText`;
- `@atom-forge/brickee/schema` — `blocksSchema` és `blocksSchemaFor`, `zod`-dal építve (opcionális peer dependency: telepítsd, ha ezt a belépési pontot használod).

## Dokumentum validálása

```ts
// content.server.ts
import { blocksSchemaFor } from '@atom-forge/brickee/schema';
import { plugins } from '$lib/blocks';

const contentSchema = blocksSchemaFor(plugins);

export function parseContent(input: unknown) {
	const result = contentSchema.safeParse(input);
	if (!result.success) throw new Error('Invalid content');
	return result.data; // StoredBlock[]
}
```

A `blocksSchema` bármely dokumentum alakját ellenőrzi; a `blocksSchemaFor(plugins)` ehhez hozzáveszi a tárolók `accepts` listáit. Minden pluginból csak a `type` és az `accepts` kell neki, így az a szerver, amely nem akarja importálni a plugin-komponenseket, csak ezeket is átadhatja:

```ts
const contentSchema = blocksSchemaFor([
	{ type: 'note', accepts: ['md:*', 'youtube'] },
	{ type: 'youtube' }
]);
```

Amit a séma ellenőriz:

| Szabály | Korlát |
|---|---|
| Blokkkulcsok | Csak `type`, `indent`, `text`, `props`, `blocks` (szigorú objektumok). |
| `type` | `^[a-z][a-z0-9:-]{0,39}$` |
| `indent` | Egész szám, 0–6. |
| `text` | Legfeljebb 100 000 karakter. |
| `props` | Legfeljebb 60 karakteres kulcsok, JSON-értékek. |
| `blocks` | Tárolónként legfeljebb 500 beágyazott blokk, csak egy szint mélyen. |
| Dokumentum | Legfeljebb 2000 legfelső szintű blokk és JSON-ként 1 000 000 karakter. |
| `accepts` (`blocksSchemaFor`) | Minden beágyazott blokkot befogad a tárolója. |

Amit **nem** ellenőriz: hogy egy típus ismert-e, hogy egy egyedi blokk csak egyszer fordul-e elő, és hogy mit tartalmaz a props. Az alkalmazásod által megkövetelt szabályokhoz adj hozzá saját finomításokat – például az ismeretlen blokktípusok elutasításához:

```ts
import type { StoredBlock } from '@atom-forge/brickee/model';
import { blocksSchemaFor } from '@atom-forge/brickee/schema';
import { plugins } from '$lib/blocks';

const BUILT_IN = ['md:p', 'md:h1', 'md:h2', 'md:h3', 'md:h4', 'md:h5', 'md:h6', 'md:ul', 'md:ol', 'md:todo', 'md:quote', 'md:code', 'md:hr'];
const known = new Set([...BUILT_IN, ...plugins.map((p) => p.type)]);
const allKnown = (list: StoredBlock[]): boolean => list.every((b) => known.has(b.type) && allKnown(b.blocks ?? []));

export const contentSchema = blocksSchemaFor(plugins).refine(allKnown, 'Unknown block type.');
```

> **Alak, nem biztonság**
>
> A séma szabályos és korlátos méretű dokumentumokat biztosít; a propsokat viszont nem teszi biztonságosan renderelhetővé. A renderelők minden szöveget escape-elnek, és a hivatkozásokat biztonságos sémákra korlátozzák, a saját propsait pedig minden plugin-előnézetnek magának kell megtisztítania (lásd [Pluginok írása](writing-plugins.md)).

## Egyszerű szöveg

A `blocksToPlainText(blocks)` sorrendben összegyűjti egy dokumentum minden szövegét, üres sorokkal elválasztva: a blokkszövegeket jelölések és hivatkozáscélok nélkül, a szóközt tartalmazó szöveges propsokat (címek, képaláírások – azonosítók és színek nem), a táblázatsorokat és a beágyazott blokkokat. Keresőindexekhez, leadekhez és meta descriptionökhöz használd. Az `inlineToPlainText(md)` ugyanezt teszi egyetlen inline markdown szöveggel.

```ts
import { blocksToPlainText, type StoredBlock } from '@atom-forge/brickee/model';

export const description = (doc: StoredBlock[]) => blocksToPlainText(doc).slice(0, 160);
```

## Renderelés

A `Preview` hagyományos Svelte-komponens, és szerveren is renderelhető; a mag renderelője és a mellékelt előnézetek nem használnak böngésző-API-kat. Csak a markdown-export útvonalnak (`toMarkdown`, `toStored`) kell a böngésző.
