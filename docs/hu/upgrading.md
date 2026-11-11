# Frissítés

[← Előző](recipes-and-pitfalls.md) · [Tartalom](index.md)

Ez a fejezet azokat a változásokat sorolja fel, amelyek teendőt igényelhetnek, amikor az `@atom-forge/brickee` újabb verziójára váltasz. Minden szakasz egy verziólépést tárgyal, a legújabbal kezdve, és minden változás egy **Teendő:** bekezdéssel zárul.

A tőled semmit nem igénylő változások – új exportok, javítások, dokumentációfrissítések – csak a változásnaplóban (`CHANGELOG.md`, a csomaggal együtt szállítva) szerepelnek.

## A 0.0.2-ről a 0.0.3-ra

### A szerkesztő `dist` mappájának Tailwind `@source`-nak kell lennie

A szerkesztő saját stílusai scoped CSS-ből Tailwind-osztályokba (az `@atom-forge/ui` téma színeivel) és SCSS-be kerültek. A Tailwind 4 nem néz bele a `node_modules`-ba, így a csomagra mutató `@source` nélkül a szerkesztő sorai, menüi, mezősávja és táblázata elveszítik a kinézetüket. Az előnézetet ez nem érinti: a stílusai továbbra is a jelölésével utaznak.

**Teendő:** abban a CSS-fájlban, ahol az `@atom-forge/ui`-t beállítod, vedd fel az `@source "../node_modules/@atom-forge/brickee/dist";` sort (az attól a fájltól vett útvonallal) az `@atom-forge/ui`-é mellé. A csak `Preview`-t mutató oldalakon nincs teendő.

### A kapus blokkok megszűntek

A tartalom védése (támogatói vagy fizetőfalas elválasztó) az alkalmazás fogalma, nem a szerkesztőé. Kikerült a `BlockPlugin.gate`, a `Preview` `markGated` propja, a „For supporters only” szakasza a `.supporters` és `.supporters-label` osztályokkal, valamint a magyar fordítás `For supporters only` szövege. A `Preview` mostantól minden kapott blokkot renderel. A `unique` marad.

**Teendő:** töröld a `gate: true`-t a pluginodból és a `markGated`-et az előnézeteidből. Az elválasztód közönséges (egyedi) pluginblokk marad, így a tárolt dokumentumok továbbra is betöltődnek. Ahol a védett részt megjelölve mutattad, rendereld a dokumentumot magad két részben – `const at = doc.findIndex((b) => b.type === 'divider')`, majd `doc.slice(0, at + 1)` és `doc.slice(at + 1)` két `<Preview>`-ban, a saját jelölésedben –, és a hozzáférés nélküli olvasóknak továbbra is vágd le a védett részt, mielőtt az oldalra kerül. Az általad mutatott feliratokhoz adj saját fordítást.

## A 0.0.1-ről a 0.0.2-re

### A képek és a média már nem részei a csomagnak

A csomag többé nem ismeri a kép fogalmát. Hogy egy blokk a kép URL-jét vagy egy azonosítót tárol, hogyan választja ki a felhasználó a képet, és hogyan lesz a tárolt értékből cím, azt az alkalmazás saját képpluginja dönti el (lásd [Képek](writing-plugins.md#képek)).

| Eltávolítva | Mi volt |
|---|---|
| `kind: 'image'`, `kind: 'images'` | Mezőfajták, amelyek egy kiválasztott médiaelem azonosítóját (vagy azonosítóit) tárolták, a beépített képválasztó felugró ablakkal |
| Az `Editor` és a `Preview` `media` propja | A képek, amelyek közül a blokkok választhattak, és amelyekre hivatkozhattak |
| `provideMedia`, `useMedia`, `findMedia`, `MediaItem` | A média-kontextus, a keresője és a típusa |
| A `toMarkdown` `media` beállítása | A `toMarkdown(blocks, { plugins, media })` helyett most `toMarkdown(blocks, { plugins })` |
| `ctx.media` egy plugin `markdown(props, ctx)` függvényében | A `MarkdownContext` most `{ inner }` |

A `PropField['kind']` most `'text' | 'textarea' | 'color' | 'select' | 'slider'`. A tárolt dokumentumokat ez nem érinti: egy blokk propsa megtartja, amit tárolt, az azonosítókat is.

**Teendő:** a képpluginjaidban cseréld le az `image` és `images` mezőket saját kiválasztásra — egy gombra a plugin nézetében, amely megnyitja a médiaablakodat vagy egy feltöltést, és az eredményt a `props`-ba írja, vagy egy egyszerű `text` mezőre egy URL-hez —, és tartsd meg a prop-kulcsokat, hogy a tárolt dokumentumok továbbra is betöltődjenek. Töröld a `media` propot a szerkesztőidről és előnézeteidről, és a `media` beállítást a `toMarkdown`-hívásaidból. Ahol egy nézet, előnézet vagy `markdown` alak a `useMedia`, `findMedia` vagy `ctx.media` segítségével alakított címmé egy azonosítót, ott az alkalmazásod saját adatában keresd ki: az alkalmazásod egy moduljában, vagy egy saját Svelte-kontextusban, amelyet a szerkesztő és az előnézet fölött adsz meg (a `markdown` komponenseken kívül fut, ezért modulbeli adat kell neki). Ha továbbra is szükséged van rá, definiálj egy `MediaItem`-szerű típust az alkalmazásodban.

## A `block-editor` munkaterület-csomagról a 0.0.1-es változatra

Ez a szakasz csak azoknak az alkalmazásoknak szól, amelyek már azelőtt használták a szerkesztőt, hogy ebből a csomagból lett volna.

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
