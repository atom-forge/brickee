# Frissítés

[← Előző](recipes-and-pitfalls.md) · [Tartalom](index.md)

Ez a fejezet azokat a változásokat sorolja fel, amelyek teendőt igényelhetnek, amikor az `@atom-forge/brickee` újabb verziójára váltasz. Minden szakasz egy verziólépést tárgyal, a legújabbal kezdve, és minden változás egy **Teendő:** bekezdéssel zárul.

A tőled semmit nem igénylő változások – új exportok, javítások, dokumentációfrissítések – csak a változásnaplóban (`CHANGELOG.md`, a csomaggal együtt szállítva) szerepelnek.

> **Egyelőre nincs szükség migrációra**
>
> Az `@atom-forge/brickee`-nek még nem volt olyan kiadása, amely változtatást igényelt volna az azt használó kódban. Az alábbi szakasz csak azoknak az alkalmazásoknak szól, amelyek már azelőtt használták a szerkesztőt, hogy ebből a csomagból lett volna.

## A `block-editor` munkaterület-csomagról az Unreleased változatra

A szerkesztő `block-editor` néven, egy alkalmazáson belüli munkaterület-csomagként indult. Ugyanazzal a tárolt alakkal költözött ide `@atom-forge/brickee` néven, így az elmentett dokumentumokat nem kell átalakítani. Az import-azonosítók megváltoztak, a plugin-kit a pluginok belépési pontjából átkerült a magba, az oldalspecifikus pluginok pedig az alkalmazásnál maradtak.

### Csomagnév és belépési pontok

| Előtte | Utána |
|---|---|
| `block-editor` | `@atom-forge/brickee` |
| `block-editor/plugins` | `@atom-forge/brickee/plugins` |
| `block-editor/locales/hu` | `@atom-forge/brickee/locales/hu` |

**Teendő:** cseréld le a függőséget (`"block-editor": "workspace:*"` → `"@atom-forge/brickee"`), és nevezd át az importokat. Telepítsd az alkalmazás függőségeként az `@atom-forge/ui`-t és a `@lucide/svelte`-et, ha még nincsenek meg, valamint a `zod`-ot, ha a sémát használod.

### A kit a magban van

A `Frame`, az `Empty` és a plugin-segédfüggvények a mag belépési pontjából exportálódnak. A `safeColor`, a `viewValues`, a `baseValue` és a `lines` már nem exportálódik a pluginok belépési pontjából.

```ts
// Előtte
import { safeColor, viewValues } from 'block-editor/plugins';

// Utána
import { safeColor, viewValues } from '@atom-forge/brickee';
```

**Teendő:** a `Frame`, `Empty`, `safeColor`, `viewValues`, `baseValue`, `lines`, `mdText`, `mdJoin` és `mdQuote` elemeket az `@atom-forge/brickee`-ből importáld. A megmaradt mellékelt pluginok segédfüggvényei (`youtubeId`, `mapSrc`, `gapLines`, `tableHeads`…) az `@atom-forge/brickee/plugins`-ban maradnak.

### Az oldalspecifikus pluginok kikerültek a csomagból

A csomag mostantól csak négy általános célú plugint tartalmaz: `table`, `youtube`, `map` és `gap` (a `PLUGINS` ezt a négyet tartalmazza). A `block-editor/plugins` többi pluginja és a segédfüggvényeik alkalmazásspecifikusak voltak, és nem részei az `@atom-forge/brickee`-nek:

| Eltávolítva | Fajta |
|---|---|
| `richBox`, `feature`, `sideBox`, `callout`, `spoiler`, `faq`, `imageText` | tároló pluginok |
| `image`, `gallery`, `tweet`, `form`, `banner`, `locked` | pluginok |
| `CALLOUTS`, `calloutTone`, `CalloutTone`, `questions`, `formEmbed`, `formHeight` | a segédfüggvényeik |
| `postId`, `userName`, `RATIO_MIN`, `RATIO_MAX`, `ratioPercent`, `ratio` | a korábbi `plugins/util` segédfüggvényei |
| `ImageProps`, `GalleryProps`, `CalloutProps` és e pluginok többi props-típusa | típusok |

A tárolt alak nem változott: az ilyen blokktípusokat tartalmazó dokumentumok érvényesek maradnak, amíg az alkalmazás ugyanazokkal a `type` értékekkel ad át pluginokat a szerkesztőnek és az előnézetnek.

**Teendő:** ha az alkalmazás ezek közül bármelyik plugint használja, tartsd meg belőlük a saját másolatodat (a nézeteiket, előnézeteiket és segédfüggvényeiket) az alkalmazásban, a mag kitjére építve, és vedd fel őket az alkalmazás pluginlistájába ugyanazzal a `type`-pal. A megmaradt négy plugint és a segédfüggvényeiket a korábbiakhoz hasonlóan az `@atom-forge/brickee/plugins`-ból importáld. A lemásolt pluginok felületi szövegeit add hozzá a `messages`-hez: az `@atom-forge/brickee/locales/hu` már nem tartalmazza őket.
