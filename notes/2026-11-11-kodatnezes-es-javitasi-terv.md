# Kódátnézés és javítási terv (2026-11-11)

A `src/lib` teljes átolvasása alapján, a 0.0.2 utáni, még ki nem adott markdown-munkával együtt. A Brickee frontend
könyvtár: minden pont a böngészőben futó szerkesztőre és előnézetre vonatkozik.

Jelölés: **[mért]** = lefuttatva, mérve; **[kód]** = a kódból olvasva, élesben nem próbálva.

## Döntések (2026-11-11)

- **Függőségek:** az `@atom-forge/ui` kötelező függőség marad, és bővíthető is: ahol a ui-nak van megfelelő komponense
  (gomb, popover, menü, mező), a szerkesztő azt használja a saját megoldás helyett. A brickee AtomForge-csomag, a ui
  beállítása (téma-CSS, Tailwind `@source`, `Root`) amúgy is feltétel. A `@lucide/svelte` marad (a ui is lucide-ot
  használ); a `zod` opcionális marad a `schema` belépési ponthoz.
- **Gate:** nem a szerkesztő dolga, teljesen kikerül (2.4).
- **Unique:** marad (általános szabály: egy dokumentumban legfeljebb egy ilyen blokk, csak a legfelső szinten).
- **Stílus:** sima CSS nem marad; Tailwind, ahol lehet, SCSS a maradékra (3.0). Mivel a ui-függőség miatt a befogadónak
  Tailwind és `@source` amúgy is kell, a Tailwind a libben is vállalható.

## Megállapítások

### Hibák

| # | Mi | Hol | Állapot |
|---|---|---|---|
| H1 | Az `inline()` HTML-tag-felismerése sok lezáratlan tagnél (`<a x><a x>…`) köbösen lassul: 4000 karakter 0,6 s, 8000 karakter 5,6 s, 20 000 karakter percek. Ilyen szöveg beillesztése vagy megnyitása megfagyasztja a tabot. A 0.0.2 után került be, **nincs kiadva**. | `markdown.ts`, `inline()` két tag-regexe | [mért] |
| H2 | A plugin nézetéből jövő változások (táblázatcella, sor/oszlop, saját plugin gombjai) nem kerülnek a visszavonási előzménybe. A beágyazott szerkesztő (Frame) saját előzményt vezet, a külső nem tud a belső változásról. | `Editor.svelte`, a `PluginHost` `bind:props` / `bind:blocks` settere | [kód] |
| H3 | Blokkok másolása/beillesztése elveszíti a pluginokat: a vágólapra csak markdown kerül, a beillesztés csak `text/plain`-t olvas. YouTube-blokk → linkes bekezdés; markdown-alak nélküli blokk (gap, saját plugin) eltűnik. | `Editor.svelte`, `onCopy`, `onPaste` | [kód] |
| H4 | `readonly` módban is visszaír a `value`-ba (mountoláskor normalizál): a befogadó alkalmazás „módosult” állapotot láthat. | `Editor.svelte`, „document io” effektek | [kód] |
| H5 | A `gate` alkalmazásfogalom (gamer365 támogatói tartalom) a magban: `BlockPlugin.gate`, a `Preview` `markGated` propja, fix „For supporters only” felirat, `.supporters` stílusok. | `types.ts`, `Preview.svelte` | [kód] — döntés: kikerül |

### Teljesítmény

| # | Mi | Hol |
|---|---|---|
| P1 | Minden változásnál a teljes dokumentum újraszámolódik: `value.map(toStored)` (blokkonként DOM-elem + HTML-parse), kétszer `JSON.stringify` az egészre, és minden blokkhoz új objektum. Emiatt az előnézet is minden blokkra újrafuttatja az `inline()`-t, a plugin-előnézetek új propokat kapnak. | `Editor.svelte` „document io”; hatása: `Preview.svelte` |
| P2 | A visszavonás lépésenként a teljes dokumentum JSON-ját tárolja, 300 lépésig. | `Editor.svelte` „history” |

### Code smell

| # | Mi |
|---|---|
| S1 | Az `Editor.svelte` 1959 sor: előzmény, perjeles menü, turn-into menü, húzás, sweep-kijelölés, beillesztés, formázás egyben. A „beszúrás i után” minta (`value = [...value.slice(0, i + 1), nb, ...value.slice(i + 1)]`) nyolcszor ismétlődik. |
| S2 | Maradványok a gamer365-ből: `block-editor:*` kontextuskulcsok; kommentek (`content.server.ts`, „supporters-only divider”, `src/routes/(+lib)/blocks`); lefordítatlan „Unknown block:”. |
| S3 | Kétféle kiemelőszín: a szerkesztő fix kék (`--accent: #3b82f6`), a mezősáv a téma `--color-accent`-je. A szerkesztő betűje fix (`17px system-ui`), nem örökli a befogadó oldalét, így eltér az előnézettől. |
| S4 | `document.execCommand` a formázáshoz és szövegbeszúráshoz: elavult API (ma működik). |
| S5 | Nincs teszt-workflow: a CI csak tagre fut. A szerkesztő viselkedésére nincs teszt. |
| S7 | Sima CSS a komponensekben: 14 fájlban összesen kb. 1180 sor `<style>` (`Editor.svelte` 519, `Table.svelte` 237, `PropsBar.svelte` 195). Döntés (2026-11-11): sima CSS nem marad; Tailwind, ahol lehet, SCSS a maradékra. |
| S6 | Takarítás nélküli globális figyelők/időzítők: a sweep `mousemove`-ja, a tábla `pointermove`-ja, a `typed()` időzítője megsemmisítéskor nem áll le. |

### Hiányzó funkciók

| # | Mi | Megjegyzés |
|---|---|---|
| F1 | Formázott (HTML) beillesztés: web, Word, Google Docs formázása elvész. | |
| F2 | Érintőképernyő: a blokkbuborék csak hoverre jön, a húzás HTML5 drag. | [kód], eszközön nem próbálva |
| F3 | Billentyűzetes elérés a blokkműveletekhez (turn-into menü, fogantyú). | |
| F4 | Fájl bedobása/beillesztése: nincs plugin-kapu (a `fromTable` mintájára `fromFile`). | A lib képfogalom nélkül marad. |
| F5 | Formázás a táblázatcellákban (nyers markdown látszik). | |
| F6 | A `position: fixed` menük transzformált szülőben (animált drawer/modal) elcsúszhatnak. | [kód] |

## Javítási terv

Három szakasz. Az 1. szakasz feltétele a következő kiadásnak; a 2. kis, önálló javítások; a 3. nagyobb fejlesztések,
külön-külön dönthetők el.

### 1. szakasz — a 0.0.3 előtt (KÉSZ, 2026-11-11)

Elkészült: a tag-felismerés egyetlen, korlátos regex + veremmel párosító replacer (`TAG`, `htmlTag()`); a link címkéje
nem tartalmazhat `[`-t és korlátos, a link célja és a kiemelések korlátosak; a `fromMarkdown` címsor- és sorvégi
feldolgozása regex nélküli; a hivatkozásfeloldás korlátos. Mérés 100 000 karakteren: minden minta 100 ms alatt (előtte
másodpercek–percek). Tesztek: `markdown.test.ts` „linear on hostile input” és „inline html is always balanced”.

#### 1.1 H1: lineáris HTML-tag-feldolgozás az `inline()`-ban

Ok: két regex, `&lt;([a-z]+)(?:\s[^]*?)?&gt;([^]*?)&lt;\/\1\s*&gt;` (páros tag) és
`&lt;\/?[a-z][\w-]*(?:\s[^]*?)?\/?&gt;` (maradék tag törlése). A páros tag minden nyitóra a szöveg végéig keres zárót,
a lusta attribútum-rész pedig minden `&gt;`-nél újrapróbál.

Megoldás: egyetlen, balról jobbra haladó menet, verem segítségével.

1. Egy globális regex csak **egy** taget ismer fel (nyitót, zárót vagy önzárót), nem párokat. Az attribútum-része
   korlátos: legfeljebb 500 karakter, és nem tartalmazhat `&lt;`-t vagy `&gt;`-t. Így egy illesztési kísérlet
   költsége korlátos, az egész menet lineáris.
2. A `replace` visszahívása egy vermet vezet:
   - `<br>`: `stash('<br>')`.
   - ismert jelölés (`HTML_MARKS`) nyitója: verembe tesz, `stash('<mark>')`.
   - ismert jelölés zárója: ha a verem tetején ugyanez áll, levesz, `stash('</mark>')`; ha a veremben lejjebb van, a
     fölötte lévőket is lezárja (helyes egymásba ágyazás); ha nincs a veremben, eldobja.
   - ismeretlen tag: üres szöveg (a tartalma marad).
3. A menet végén a veremben maradt jelöléseket lezárja (a kimenet mindig kiegyensúlyozott HTML).

Tesztek (`markdown.test.ts`):
- a mostani esetek változatlanul zöldek (`<strong>`, `<em>`, `<del>`, `<u>`, `<br>`, `<kbd>`, `<span class>`);
- lezáratlan `<b>x` → `<b>x</b>`; rossz sorrendű zárás (`<b><i>x</b></i>`) → kiegyensúlyozott kimenet;
- teljesítményteszt: 100 000 karakteres `<a x>`-ismétlés, `[`-ismétlés, `**a `-ismétlés egyenként 200 ms alatt.

Kész, ha: a fenti tesztek zöldek, és a `notes` mérése (8000 karakter, `<a x>`) 5,6 s helyett néhány ms.

#### 1.2 A többi mintázat lekorlátozása (megelőzés)

Mérve gyorsak (8000 karakteren ≤ 30 ms), de négyzetesek: `[`-ismétlés (LINK), `**a `, `_a `, `*a `. 100 000 karakteres
blokknál ez másodpercek. A teljesítményteszt (1.1) eldönti, kell-e javítás; ha igen:
- LINK: a címke `[^\]]*` helyett `[^\[\]]{0,1000}` (beágyazott `[` nélkül, korlátos hosszal);
- kiemelések: a `(.+?)` helyett `(.{1,2000}?)`.

### 2. szakasz — kis javítások

#### 2.1 P1: blokkonkénti gyorsítótár a tárolt alakhoz

KÉSZ: leütésenként csak a szerkesztett blokk megy át a DOM-on; 2000 blokk + előnézet: kb. 50 → 33 ms, 500 blokk: kb. 10 → 6 ms (`/dev/perf`). A read-only szerkesztő nem ír vissza. Kívülről új tömbbel kell frissíteni (helyben módosítást nem vesz észre) — dokumentálva.

Cél: változatlan blokkra ugyanaz a `StoredBlock` objektum jöjjön vissza, DOM-munka nélkül.

1. `Editor.svelte`: `const stored = new Map<string, { key: string; out: StoredBlock }>()` a blokk `id`-jával.
   A kulcs a blokk tárolást meghatározó mezőiből áll: `type`, `indent`, `html`, `checked`, `plugin`, valamint a `props`
   és a `blocks` **referenciája** (ezeket a kód mindig új objektumra cseréli, nem helyben módosítja — ezt a
   `setProp` / `setValue` / `toPlugin` / `convert` átnézésével ellenőrizni kell; ahol helyben módosít, ott cserére
   kell átírni).
2. Az effekt: `value.map((b) => cached(b))`; a törölt blokkok bejegyzéseit a menet végén kidobja.
3. A „kívülről cserélték-e” vizsgálat `JSON.stringify(doc) !== written` helyett: a kiírt tömb referenciáját jegyzi
   meg (`doc !== lastWritten`), és csak eltérésnél hasonlít mélyen. Így gépelés közben nincs teljes szerializálás.
4. H4 ugyanitt: `readonly` módban az effekt nem ír vissza a `doc`-ba (csak betölt).

Tesztelés: Playwright-mérés a bemutatóoldalon egy 500 blokkos dokumentummal (gépelés közbeni `input` → következő
képkocka idő) előtte és utána; az előnézetben a plugin-komponensek nem kapnak új propot, ha a blokkjuk nem változott.

Kész, ha: gépeléskor csak a szerkesztett blokk `toStored`-ja fut, és az előnézetben csak annak az `inline()`-ja.

#### 2.2 H2: pluginváltozások a visszavonási előzményben

KÉSZ: táblacella, sor, oszlop és beágyazott szerkesztő is visszavonható; Ctrl+Z a táblacellában a szerkesztőé; külső betöltés törli az előzményt. Élőben ellenőrizve.

1. `Editor.svelte`: a `PluginHost` két settere hívja a `typed()`-ot a hozzárendelés előtt:
   `bind:props={() => b.props ?? {}, (p) => { typed(); b.props = p; }}`, ugyanígy a `blocks`-ra.
   A `typed()` 600 ms-os összevonása miatt a folyamatos cellagépelés egy lépés lesz.
2. Beágyazott szerkesztők: a belső szerkesztő Ctrl+Z-je a saját előzményét használja (ez marad). A külső
   szerkesztő a `blocks` setteren keresztül szintén lépést rögzít, így a külső visszavonás a belső változást is
   visszaviszi. Ellenőrizni kell, hogy a külső `restore()` után a belső szerkesztő újratölt-e (a „kívülről cserélték”
   ág), és hogy a belső előzmény ilyenkor törlődjön (különben a belső Ctrl+Z régi állapotot hozhat vissza).
3. A tábla `textarea`-iban a böngésző saját visszavonása ütközhet a szerkesztőével: a tábla `onKey`-je kapja el a
   Ctrl+Z / Ctrl+Shift+Z-t, és engedje fel a szerkesztőnek (ne a natív fusson).

Kész, ha: táblacella-szerkesztés, sor törlése, oszlop áthúzása és egy note dobozba írt szöveg is visszavonható a
Ctrl+Z-vel, és az újra (redo) is működik.

#### 2.3 H3: saját vágólap-formátum

KÉSZ: `application/x-brickee+json` blokkonkénti markdownnal; nem kínált / második unique plugin a markdownjára esik vissza; üres blokk helyére kerül; blokk-kijelölésnél utána. Élőben ellenőrizve.

1. `onCopy`: a `text/plain` (markdown) mellé `application/x-brickee+json` is kerül: a kijelölt blokkok tárolt alakja
   (`toStored`), verziószámmal: `{ v: 1, blocks: StoredBlock[] }`.
2. `onPaste`: ha van ilyen adat, azt használja a markdown helyett: `fromStored` → `fit()` (a palettán kívüli plugin
   a markdown-alakjára esik vissza, vagy kimarad) → beszúrás a meglévő logikával. Ismeretlen `v` esetén markdown.
3. Biztonság: a JSON-t a `blocksSchema`-val nem lehet ellenőrizni a magban (a zod opcionális), ezért kézi
   alakellenőrzés (tömb, `type` string, `indent` szám, mélység ≤ `MAX_DEPTH`), hibánál markdown.
4. Szöveges kijelölés (nem blokk-kijelölés) másolása marad a böngészőé.

Kész, ha: YouTube-, tábla-, gap- és note-blokk másolás-beillesztéssel ugyanaz a blokk marad, másik szerkesztőbe
(másik tab) is; idegen alkalmazásba illesztve markdown érkezik.

#### 2.4 H5 + S2: alkalmazásfüggő maradványok

KÉSZ: a `gate` kikerült a kódból, a bemutatóoldalról és a dokumentációból (upgrading-bejegyzéssel); kontextuskulcsok `brickee:*`; régi kommentek átírva; „Unknown block: {type}” fordítható.

1. A `gate` teljesen kikerül (**breaking**):
   - `types.ts`: a `BlockPlugin.gate` mező és a kommentje;
   - `Preview.svelte`: a `markGated` prop, a `lockAt` / `open` / `locked` vágás, a `.supporters` blokk és stílusai;
     a `Preview` egyszerűen a teljes `blocks`-ot rendereli;
   - `locales/hu.ts`: „For supporters only”;
   - a `unique` dokumentációjából a „supporters-only divider” példa (helyette pl. tartalomjegyzék);
   - dokumentáció: könyv, en/hu docs (editor-and-preview `markGated`, writing-plugins „Unique and gate blocks”
     → „Unique blocks”, recipes, server-side), `README-AI.md` (API, szabály, buktató);
   - upgrading fejezet: aki használta, a saját rendererében vagy a mentéskor vágja el a dokumentumot a saját
     elválasztó blokkjánál (`blocks.findIndex((b) => b.type === 'divider')`); a gamer365 ennek az első felhasználója.
   - A `unique` marad; a mag kódja (`Editor.svelte`: menüből eltűnik, ha már van egy; beágyazott szerkesztő nem
     kínálja) nem változik.
2. Kontextuskulcsok: `block-editor:*` → `brickee:*` (belső, nem breaking, de két eltérő verzió egy oldalon nem
   látja egymást — elfogadható).
3. Kommentek átírása; „Unknown block: {type}” a `tr`-en keresztül, `hu` fordítással.

#### 2.5 S5 + S6: CI és takarítás

KÉSZ: `.github/workflows/test.yml`; `onDestroy` takarítás az `Editor`-ban és a `Table`-ben.

1. `.github/workflows/test.yml`: push és PR esetén `bun install --frozen-lockfile`, `bun run check`, `bun run test`
   (a Ship repó `test.yml`-je a minta).
2. `Editor.svelte`: `onDestroy`-ban `clearTimeout(timer)` és a sweep figyelőinek eltávolítása; `Table.svelte`:
   a húzás figyelői megsemmisítéskor is lekerülnek.

#### 2.6 S3: kiemelőszín és tipográfia

A stílusok átállításával (3.0) együtt készül, nem külön: ott a színek a téma Tailwind-tokenjei lesznek.
Döntés kell: a kiemelés kövesse-e a téma `accent` színét (egységes a mezősávval), vagy maradjon kék. Javaslat:
kövesse (`text-accent`, `bg-accent/10`…). A szerkesztő betűje örökölje a befogadó oldalét (`font: inherit`), hogy
egyezzen az előnézettel; ez látható változás, a changelogba kerül.

### 3. szakasz — fejlesztések (a 3.0 eldöntve, a többiről külön döntés)

#### 3.0 S7: stílusok — Tailwind, ahol lehet; SCSS a maradékra; sima CSS sehol

KÉSZ (a 2.6 nélkül): 1–7. lépés pixelre egyezően (`scripts/shots.mjs` + `shots-diff.mjs`, `/dev/states`), egy szándékos javítással (a tábla `table` osztálya ütközött a Tailwind `display: table`-jével). Előnézetek: SCSS + `css="injected"`. Dokumentálva a `@source` lépés (getting-started, buktatók, upgrading, README-AI).

Döntés (2026-11-11). Szabály az új és az átírt kódra:

- **Tailwind** minden, ami utility osztályokkal olvashatóan kifejezhető: elrendezés, térköz, szín, betű, keret,
  árnyék, hover/focus/disabled, sötét mód (a téma tokenjeivel: `bg-surface`, `text-muted-contrast`, `border-frame`,
  `text-accent`). Fix hex szín nem marad; ahol kell áttetszőség, `bg-accent/10`-féle alak.
- **SCSS** (`<style lang="scss">`) csak arra, amit utility nem fejez ki tisztán: szülő- és testvérállapotra épülő
  szelektorok (`.row:focus-within:not(:has(.row:focus-within)) > .gutter .handle`), `@keyframes`, `::before` /
  `::after` jelölők (húzásjelző, a contenteditable placeholdere), a `{@html}`-lel és a contenteditable-lel bekerülő
  tartalom (`:global(a)`, `:global(code)`). SCSS-ben beágyazás és a téma változói; `@apply` nem (Tailwind 4-ben
  `@reference` kellene hozzá, és elrejti, hol van a stílus).
- Sima `<style>` blokk nem marad.

Előkészítés:

1. `sass` fejlesztői függőség, `svelte.config.js`: `preprocess: vitePreprocess()`. A `svelte-package` a `dist`-be
   már lefordított CSS-t ír, a befogadó alkalmazásnak **nem** kell sass.
2. A befogadó alkalmazásnak a Tailwind miatt új beállítási lépés: `@source` a brickee `dist` mappájára (ahogy az
   `@atom-forge/ui`-éra; a ui-függőség miatt a Tailwind amúgy is kötelező, ez csak egy további sor). **Breaking**: getting-started (könyv, en/hu docs), `README-AI.md` szabály és buktató
   („a szerkesztő stílus nélkül jelenik meg” → hiányzó `@source`), upgrading fejezet. A bemutatóoldal `site.css`-e a
   saját `src/lib`-jét amúgy is olvassa.
3. Vizuális védőháló, mert nincs vizuális teszt: `scripts/shots.mjs` (Playwright, a mostani eseti szkriptekből) a
   bemutatóoldal oldalairól világos és sötét módban, nyitott mezősávval, kijelölt cellával, nyitott perjeles és
   turn-into menüvel készít képet egy mappába; átírás előtt alapkép, minden komponens után összevetés
   (pixelkülönbség + szemre).

Sorrend, komponensenként külön commit, mindegyik után `bun run check`, `bun run test`, képek összevetése:

| Lépés | Fájl | `<style>` sor | Várható eredmény |
|---|---|---|---|
| 1 | `kit/Empty`, `LinkPrompt`, `plugins/Gap`, `plugins/Map`, `plugins/YouTube` | 6–27 | tiszta Tailwind |
| 2 | `kit/Frame` | 31 | Tailwind; a mezők negatív margója tetszőleges értékkel (`-mx-[…]`) |
| 3 | `PropsBar` | 195 | Tailwind; a `:global(input)` betűméret-szabály SCSS marad, vagy az `@atom-forge/ui` vezérlők `class` propjával kiváltva |
| 4 | `plugins/Table` | 237 | eszköztár és gombok Tailwind; a rács (húzásjelzők, `tr.h-top`, fókuszkeret) SCSS |
| 5 | `Editor` lebegő elemei (menük, formázósáv, buborék) | ~200 | Tailwind; a 3.6-os bontással együtt, saját komponensekben |
| 6 | `Editor` magja (sor, fogantyú, kijelölés, húzás, blokktípusok tipográfiája) | ~320 | a doboz-jellegű részek Tailwind, az állapotgép SCSS |
| 7 | előnézetek (`Preview`, `TablePreview`, `YouTubePreview`, `MapPreview`, `GapPreview`) | 6–43 | lásd a nyitott kérdést |

Nyitott kérdés — az előnézetek: most `css="injected"`, a stílus a jelöléssel utazik, és Tailwind nélküli oldalon is
működik. Két lehetőség:
- **SCSS, `css="injected"` megtartva** (javaslat): az előnézet önálló marad, a publikus oldalnak nem kell a brickee
  `dist`-jét Tailwinddel olvasnia. A kód így is megfelel a szabálynak (nincs sima CSS).
- **Tailwind**: egységes a többivel, de az előnézetet megjelenítő minden oldalnak kell a `@source`, és a `{@html}`
  tartalom (`table`, `th`, `td`) stílusához így is kell szelektor.

Kész, ha: `grep -L 'lang="scss"'` a `<style>`-t tartalmazó komponensekre üres; a képek a szándékos változásokon
(kiemelőszín, öröklött betű) kívül egyeznek; a dokumentáció leírja az `@source` lépést.

#### 3.1 F1: formázott beillesztés

1. `onPaste`: ha nincs saját formátum (2.3), de van `text/html`: egy `htmlToBlocks(html)` átalakító (böngészőben,
   `DOMParser`-rel): blokk-elemek (`p`, `h1`–`h6`, `ul`/`ol`/`li` beágyazással, `blockquote`, `pre`, `hr`, `table`
   → `fromTable`) → `Block[]`; inline: `b/strong`, `i/em`, `u`, `s/del`, `code`, `a[href]` (biztonságos sémák),
   `br`; minden más tag elmarad, a szövege marad. Stílusból csak a Google Docs-féle `font-weight:700` /
   `font-style:italic` span-ek felismerése.
2. A kimenet a meglévő `walk()` jelöléskészletére szűkül, így tároláskor nem változik.
3. Tesztek rögzített mintákkal: Chrome-ból másolt weboldal, Google Docs, Word, VS Code.

#### 3.2 F4: fájlok fogadása

1. `BlockPlugin.fromFiles?(files: File[]): Props | Promise<Props> | null` — az első plugin, amelyik nem `null`-t ad,
   megkapja; a feltöltés az alkalmazás dolga (a plugin a saját kódjában intézi, akár aszinkron).
2. `onPaste` (ha `clipboardData.files` nem üres) és a gyökér `ondrop` (külső fájl, nem blokkhúzás) hívja.
3. Dokumentáció: a Writing plugins „Images” szakaszában a photo példa kiegészítése.

#### 3.3 F2 + F3: érintés és billentyűzet

1. A fogantyú `<button>` legyen (fókuszálható); Enter/szóköz: kijelöl, a buborék fókuszra is megjelenik
   (`:focus-within`), a buborék gombjai Tabbal elérhetők.
2. Gyorsbillentyű a turn-into menühöz kijelölt blokkon (pl. Ctrl+/), és a blokk-kijelölésből `/` is nyissa.
3. Érintés: koppintás a fogantyúra → kijelölés + a buborék megjelenik (nem hoverfüggő); húzás `pointer`
   eseményekkel a HTML5 drag helyett (a tábla sor/oszlop húzása már így működik, az a minta). Eszközön tesztelni.

#### 3.4 F6: menük pozicionálása, és a ui komponenseinek bővebb használata

A döntés szerint a ui-függőség bővíthető. Ahol a ui-nak van megfelelő eleme, az váltja a saját megoldást:
1. A perjeles menü, a turn-into menü és a formázósáv a ui popup-kezelőjén nyíljon (a link-ablak már így megy); ez
   megoldja a transzformált szülőben való elcsúszást is. Előtte kipróbálni egy `Drawer`-ben, hogy a hiba fennáll-e.
2. A tábla eszköztára, a buborék és a menük gombjai a ui `Button` / ikon-gomb komponensével (egységes kinézet,
   fókusz és billentyűzet).
3. A ui `CommandPalette` / menü komponensének átnézése: kiválthatja-e a perjeles és a turn-into menüt (szűrés,
   billentyűzetes navigáció, akadálymentesség ingyen). Ha igen, a 3.6-os bontás ezzel a lépéssel indul.

#### 3.5 F5: formázás a táblacellákban

A cella `textarea` helyett `contenteditable`, a szerkesztő `rich` akciójával és a `walk()`/`inline()` párossal,
a formázósáv megosztásával. Nagyobb átírás; előtte eldönteni, kell-e.

#### 3.6 S1: az `Editor.svelte` bontása

RÉSZBEN KÉSZ: `editor/history.ts`, `editor/BlockMenu.svelte` (perjeles + turn-into), `editor/FormatBar.svelte`, `insertAt`. Nincs még: `drag.ts`, `sweep.ts`.

A viselkedés változtatása nélkül, lépésenként, mindegyik után `bun run check` + a bemutatóoldal kipróbálása:
1. `history.svelte.ts`: `take` / `typed` / `mutate` / `undo` / `redo` egy osztályban.
2. `SlashMenu.svelte`, `TurnMenu.svelte`, `Toolbar.svelte`: a három lebegő elem saját komponensben.
3. `drag.ts` és `sweep.ts`: a húzás és a sweep-kijelölés.
4. `insertAfter(i, ...blocks)` segédfüggvény a nyolc ismétlés helyett.
Ezt a 2. szakasz **után** érdemes, hogy a javítások ne ütközzenek az átszervezéssel; a 3.1–3.4 előtt, mert azok
ugyanezekhez a részekhez nyúlnak.

#### 3.7 S4 + P2: hosszabb távra

- `execCommand` kiváltása saját tartomány-műveletekkel: csak akkor, ha egy böngésző tényleg kivezeti.
- Előzmény: teljes pillanatkép helyett blokkszintű különbség; a 2.1 gyorsítótára után mérni, kell-e.

## Javasolt sorrend és kiadások

1. **0.0.3:** 1.1, 1.2 (+ a már kész markdown-munka). Önmagában kiadható.
2. **0.0.4:** 2.1 (P1 + H4), 2.2 (H2), 2.3 (H3), 2.5 (CI). Nem breaking.
3. **0.0.5 (breaking):** 2.4 (a gate eltávolítása), 2.6 és 3.0 (stílusok, lásd a 4. pontot) — upgrading fejezettel.
4. **Stílusok (3.0)** a 3.6-os bontással összefésülve: 3.0 előkészítés és 1–4. lépés → 3.6 (bontás) → 3.0 5–7. lépés.
   Ugyanabban a breaking kiadásban, mint a 2.4 és a 2.6, hogy a befogadó alkalmazásoknak egyszer kelljen igazodniuk
   (`@source`, a gate eltávolítása, kiemelőszín).
5. Utána igény szerint: 3.1, 3.2, 3.3, 3.4, 3.5.

Minden lépéshez: `CHANGELOG.md` bejegyzés, a publikus API-t érintőknél (2.3, 2.4, 2.6, 3.2) könyv + docs (en/hu) +
`README-AI.md`.
