# Inline pluginok és képletek — terv (2026-11-11)

Döntések: blokk-képlet egyszerű pluginként, Temml-lel (MathML); jelölő a GitHub/Obsidian-szabvány: `$…$` inline,
`$$…$$` blokk; az inline képlet egy új, általános bővítési pont (inline plugin) első felhasználója.

## Haladás

- [x] 1. `math` blokk-plugin, `@atom-forge/brickee/math` belépési pont, `$$…$$` beolvasása (`fromMath`)
- [x] 2. inline markdown gépelés közben (átalakítás saját visszavonási lépéssel)
- [x] 3. inline plugin bővítési pont (`InlinePlugin`, `inlinePlugins` prop, `inline()`, `walk()`, szerkesztő ablak, formázósáv)
- [x] 4. `inlineMath` (`$…$`) az inline pluginra
- [x] dokumentáció (könyv, en/hu, README-AI), bemutatóoldal, changelog

Döntések a nyitott kérdésekben: külön `inlinePlugins` prop; beszúrás a formázósávból és gépeléssel (saját menü nélkül).

## 1. Blokk-képlet: `math` plugin

- Belépési pont: `@atom-forge/brickee/math` (külön, mert saját függősége van). A `temml` opcionális peer függőség;
  aki nem importálja a belépési pontot, nem kapja meg.
- Props: `{ tex: string }`. Mező: `tex`, `textarea`, „LaTeX”. Nézet és előnézet: `temml.renderToString(tex, { displayMode: true, throwOnError: false })`
  — MathML; hibás LaTeX-nél a Temml hibaüzenetet ad vissza, nem dob.
- Markdown-alak: `$$\n<tex>\n$$`.
- Beolvasás: a `fromMarkdown` ma nem ismeri a `$$` blokkot. Általános horog kell, a `fromTable` mintájára:
  `BlockPlugin.fromFence?(info: string, body: string): P | null` vagy `$$`-specifikus `fromMath?(tex)`. Javaslat: egy
  általános **`fromBlockSyntax`** helyett most egyszerűen `$$…$$` → a `math`-ot kínáló plugin (`fromMath`); később
  általánosítható.
- SSR: a Temml szerveren is fut, így az előnézet kész MathML-t ad.

## 2. Az inline plugin (általános bővítési pont)

Cél: a szövegen belüli, egységként viselkedő elemek (képlet, később említés, emoji, változó…) úgy, hogy a tárolt alak
továbbra is inline markdown maradjon.

### Az interfész (javaslat)

```ts
interface InlinePlugin<D = Record<string, string>> {
	type: string;                       // 'math'
	label: string; icon: Icon;          // a formázósávban / a beszúró menüben
	/** Felismerés a tárolt inline markdownban (globális, korlátos regex — lineáris futás!). */
	pattern: RegExp;
	/** A találatból az adat. */
	parse(match: RegExpExecArray): D;
	/** Az adatból a markdown-alak (oda-vissza azonos). */
	markdown(data: D): string;
	/** Az adatból biztonságos HTML (előnézet és szerkesztő); a plugin felel azért, hogy ne legyen benne nyers felhasználói HTML. */
	render(data: D): string;
	/** Az adat szerkesztése kattintásra egy kis ablakban (a `PropField` mezőkkel). */
	fields: PropField[];
	/** Gépelés közbeni átalakítás (az inline-markdown-gépelés mechanizmusával): a nyitó és a záró jelölő. */
	typing?: { open: string; close: string };
	/** Sima szöveg (keresés, meta): alapból a markdown-alak. */
	text?(data: D): string;
}
```

### Hogyan illeszkedik a maghoz

- **Átadás:** az `Editor` és a `Preview` új propja `inlinePlugins` (a beágyazott szerkesztők öröklik, mint a
  `messages`-t); a `fromMarkdown`, `toMarkdown`, `fromHtml` és az `inline(md, { inlinePlugins })` opciója is.
- **`inline()`:** a pluginok mintái az escape-ek és a kódszakaszok után, a linkekkel együtt futnak; a találat a
  `render` kimenete lesz, félretéve (stash), hogy a kiemelések ne nyúljanak bele. A `\$` szó szerint marad, kódban nincs
  képlet.
- **A szerkesztő HTML-je önleíró:** `<span data-inline="math" data-md="$x^2$" contenteditable="false">…render…</span>`.
  A `walk()` (HTML → markdown) a `data-md`-t adja vissza, így a tárolt alakhoz nem kell a plugin. Ismeretlen inline
  plugin (a szerkesztő nem kapta meg) → a markdown-alak szövegként látszik, nem vész el.
- **Szerkesztés:** az elem egységként mozog, törlődik; kattintásra a pluginhoz tartozó mezőkkel nyílik egy kis ablak
  (a link-ablak mintájára, a `portal`-lal), mentéskor új `data-md` és új render.
- **Beszúrás:** a formázósáv gombja (a kijelölt szöveg lesz az adat), gépelés közbeni átalakítás (`typing`), és a
  beillesztés (markdown/HTML, a mintán keresztül).
- **Biztonság:** a `render` HTML-je `{@html}`-lel kerül ki; a dokumentáció előírja, hogy a plugin escape-eljen, a
  bundled `math` a Temml-re hagyatkozik (`trust: false`).

### Az inline képlet (`inlineMath`)

- Minta (GitHub/Pandoc-szabály, a pénzösszegek ellen): a nyitó `$` után és a záró előtt nincs szóköz, a záró `$` után nincs
  számjegy, korlátos hossz: `/(?<![\\$])\$(?![\s$])([^$\n]{1,500}?)(?<![\s\\])\$(?!\d)/g`. A `$$…$$` itt nem inline.
- `render`: `temml.renderToString(tex, { displayMode: false, throwOnError: false })`.
- `typing`: `{ open: '$', close: '$' }` — a záró `$` utáni szóköz/írásjel váltja ki (mint a többi inline jelölést).
- Ugyanabban a `@atom-forge/brickee/math` belépési pontban, mint a blokk-képlet.

## Sorrend

1. `math` blokk-plugin + `@atom-forge/brickee/math` + `$$` beolvasása (önálló, kicsi).
2. Inline markdown gépelés közben (a `TODO.md` 1. pontja) — erre épül a 4. lépés `typing`-ja.
3. Inline plugin bővítési pont a magban (`inline()`, `walk()`, `Editor`/`Preview` prop, szerkesztő ablak, formázósáv).
4. `inlineMath` az inline pluginra építve.

Nyitott kérdések: a prop neve (`inlinePlugins` vagy egy közös `plugins` tömb `kind`-dal — javaslat: külön prop, a blokk-
pluginok típusa így tiszta marad); legyen-e az inline pluginoknak saját „beszúró menüje” (pl. a perjeles menü
szövegközben), vagy elég a formázósáv és a gépelés.
