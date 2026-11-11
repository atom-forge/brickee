# A szerkesztő és az előnézet

[← Előző](getting-started.md) · [Tartalom](index.md) · [Következő →](documents-and-markdown.md)

## Az Editor propjai

| Prop | Típus | Alapérték | Jelentés |
|---|---|---|---|
| `value` | `StoredBlock[]` (bindable) | `[]` | A dokumentum. Minden változáskor visszaíródik (a változatlan blokkok megtartják az objektumukat); a kívülről lecserélt dokumentum – új tömb, nem helyben módosított – újra betöltődik, hacsak nem egyezik a mostanival. |
| `plugins` | `BlockPlugin[]` | `[]` | A pluginblokkok, amelyeket ez a szerkesztő megjeleníthet és felkínálhat. |
| `palette` | `string[]` | minden beépített blokk, utána minden plugin | A perjeles menü által felkínált blokktípusok, ebben a sorrendben (lásd lent). |
| `messages` | `Messages` | — | Felületi szövegek az alkalmazás nyelvén: angol szöveg → fordítás. |
| `inlinePlugins` | `InlinePlugin[]` | — | Szövegen belüli elemek, például képlet (lásd [Inline pluginok](writing-plugins.md#inline-pluginok)); a beágyazott szerkesztők a szülőjükét használják. |
| `readonly` | `boolean` | `false` | Szerkesztés nélkül mutatja a dokumentumot; a pluginmezők rejtve vannak. Az írásvédett szerkesztő soha nem írja a `value`-t. |
| `placeholder` | `string` | `Write something, or press '/' for blocks…` | Az üres blokk tippszövege. |
| `nested` | `boolean` | `false` | A beágyazott blokkokat tartalmazó pluginok állítják be a belső szerkesztőjükön; a befogadó alkalmazás soha nem állítja be. |

Az üres dokumentum egyetlen üres bekezdésként jelenik meg, így a szerkesztő által visszaírt érték a csatolás után soha nem üres tömb: legalább `[{ type: 'md:p', indent: 0, text: '' }]`. Az előnézet kihagyja az üres bekezdéseket.

## A Preview propjai

| Prop | Típus | Alapérték | Jelentés |
|---|---|---|---|
| `blocks` | `StoredBlock[]` | — | A megjelenítendő dokumentum. |
| `plugins` | `BlockPlugin[]` | — | A pluginok, amelyek előnézetei a pluginblokkokat renderelik. |
| `messages` | `Messages` | — | Felületi szövegek az alkalmazás nyelvén. |
| `inlinePlugins` | `InlinePlugin[]` | — | Ugyanazok az inline pluginok, mint a szerkesztőé. |
| `nested` | `boolean` | `false` | A beágyazott blokkjaikat renderelő plugin-előnézetek állítják be. |

Az előnézet a beépített blokkokat sima HTML-ként rendereli (`p`, `h1`…`h6`, `ul`/`ol` beágyazott elemekkel, `blockquote`, `pre > code` `language-<lang>` osztállyal, `hr`), a pluginblokkokat pedig a pluginjuk `preview` komponensével. Az a blokk, amelynek típusához nincs plugin a `plugins` listában, vagy amelynek pluginjának nincs `preview`-ja, nem renderelődik.

Hogy használod-e egyáltalán a `Preview`-t, rajtad múlik: a szerkesztő nem függ tőle. Egy saját megjelenítővel dolgozó alkalmazás maga is renderelheti a tárolt blokkokat, és a pluginjai elhagyhatják a `preview`-t.

A legfelső szintű szerkesztőnek vagy előnézetnek átadott `messages` öröklődik minden alatta lévő beágyazott szerkesztőre, beágyazott előnézetre és pluginkomponensre.

## A paletta

A `palette` **palettaazonosítók** listája: `md:p`, `md:h1`…`md:h6`, `md:ul`, `md:ol`, `md:todo`, `md:quote`, `md:code`, `md:hr` a beépített blokkokhoz, pluginoknál pedig a plugin `type` értéke. Ez dönti el:

- mely blokkokat kínálja fel a perjeles menü és az „Átalakítás” menü, és milyen sorrendben;
- mely markdown-gyorsbillentyűk működnek (a `## ` begépelése csak akkor alakít egy bekezdést címsorrá, ha az `md:h2` szerepel a palettán);
- mivé válhat a beillesztett markdown: a palettán kívüli típusú beillesztett blokk bekezdés lesz, az elválasztó pedig elvész.

A sima bekezdés (`md:p`) tartalékként mindig engedélyezett.

```svelte
<script lang="ts">
	import { Editor, type StoredBlock } from '@atom-forge/brickee';
	import { map, table, youtube } from '@atom-forge/brickee/plugins';

	const plugins = [table, youtube, map];
	// Nincs h1 (az oldal címe az), és nincs kódblokk.
	const palette = ['md:p', 'md:h2', 'md:h3', 'md:ul', 'md:ol', 'md:quote', 'md:hr', ...plugins.map((p) => p.type)];

	let value = $state<StoredBlock[]>([]);
</script>

<Editor bind:value {plugins} {palette} />
```

A `PALETTE_ITEMS` a beépített blokkokat sorolja fel a címkéikkel, tippjeikkel és ikonjaikkal; a `BUILT_IN_IDS` csak az azonosítóik az alapértelmezett sorrendben.

> **A paletta a felkínálást korlátozza, nem a betöltést**
>
> Ha egy dokumentumban már van palettán kívüli blokk, az továbbra is megjelenik. Az a pluginblokk, amelynek pluginja hiányzik a `plugins` listából, változatlanul megmarad, és ismeretlen blokkként jelenik meg, amelyet csak törölni lehet. Ha az ilyen dokumentumokat el akarod utasítani, validáld őket a szerveren (lásd [A szerveren](server-side.md)).

## Szerkesztés

| Művelet | Hogyan |
|---|---|
| Blokk beszúrása | A `/` megnyitja a perjeles menüt (címke, tipp, kulcsszavak és ezek fordításai alapján kereshető); a `+` gomb egy blokkot ad hozzá alul. |
| Markdown-gyorsbillentyűk | Bekezdés elején: `# `…`###### `, `- ` / `* ` / `+ `, `1. `, `[] `, `> `. |
| Szövegformázás | Jelölj ki szöveget az eszköztárhoz, vagy `Ctrl/Cmd` + `B` félkövér, `I` dőlt, `U` aláhúzott, `Shift+X` áthúzott, `E` kód, `K` link, `\` formázás eltávolítása. Az alsó és a felső index az eszköztáron érhető el. A begépelt markdown jelöléssé alakul: a `**félkövér**`, `*dőlt*` / `_dőlt_`, `~~áthúzott~~`, ha szóköz, írásjel vagy `Enter` követi; a `` `kód` `` és a `[szöveg](url)` a záró karakterére. Közvetlenül utána a `Ctrl/Cmd+Z` visszaadja a begépelt szöveget. |
| Behúzás | `Tab` / `Shift+Tab` (legfeljebb 6 szint). |
| Sortörés | `Shift+Enter`; kódblokkban az `Enter` töri a sort, a `Shift+Enter` vagy a `Ctrl/Cmd+Enter` pedig új blokkot kezd. |
| Blokkok kijelölése | Kattints (vagy koppints) egy blokk fogantyújára, nyomj `Esc`-et egy blokkban, `Shift+↑/↓` a blokk szélén túl, vagy húzz szövegkijelölést több blokkon át. Üres blokkban a `Ctrl/Cmd+A` minden blokkot kijelöl. |
| Blokkok mozgatása | Húzd a fogantyút (beágyazott szerkesztőkbe be és onnan ki is), `Ctrl/Cmd+Shift+↑/↓`, vagy az „Átalakítás” menü *Mozgatás fel* / *Mozgatás le* pontja (húzás nélkül: érintőképernyő, billentyűzet). |
| Átalakítás | Kattints egy blokk vagy egy kijelölés fogantyújára az „Átalakítás” menühöz; billentyűzetről a kijelölt blokkokon `/` (vagy `Ctrl/Cmd+/`, a menübillentyű, `Shift+F10`), egy blokk szövegében `Ctrl/Cmd+/`. Érintőképernyőn a megkoppintott blokk a fogantyúja mellett mutatja a műveleteit (új blokk alá, átalakítás, törlés). |
| Másolás, kivágás, beillesztés | A kijelölt blokkok másolásakor a markdownjuk kerül a vágólapra (a pluginblokkok a markdown alakjukon keresztül), mellé pedig maguk a blokkok is (`application/x-brickee+json`). Máshonnan (weboldal, Google Docs, Word) érkező formázott szöveg megtartja a címsorait, listáit, táblázatait és jelöléseit (`fromHtml`); a sima szöveget markdownként olvassa. Brickee-szerkesztőbe illesztve a másolt blokkok változatlanul jönnek vissza; az a pluginblokk, amelyet az a szerkesztő nem kínál fel (vagy egy második egyedi), a markdown alakjára esik vissza. Bárhová máshová illesztve a markdown érkezik. Blokk-kijelölés közben beillesztve a blokkok a kijelölés után kerülnek. |
| Beillesztés | A többsoros szöveg markdownként értelmeződik, és blokkokká válik. |
| Visszavonás, újra | `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z` vagy `Ctrl/Cmd+Y`. |

Hogy egy blokk mivé alakítható, az attól függ, mit tartalmaz (a `content` értékétől):

- a szöveges blokkok egymásba alakíthatók, és megtartják a formázásukat; ha szöveget kóddá alakítasz, csak a betűk maradnak meg;
- a tartalom nélküli blokk (elválasztó, videó, térkép) csak üres blokkokat vagy más tartalom nélküli blokkokat válthat fel;
- a beágyazott blokkokat tartalmazó blokk (egy doboz) körbefoghatja a kijelölt blokkokat, ha mindegyiket elfogadja; a **„Kicsomagolás”** kimozgatja a doboz blokkjait; egy doboz átalakítható másik dobozszerű típussá, és az azonos nevű props értékek átkerülnek.

## Görgetés-szinkron

Ha az alkalmazás egymás mellett mutatja a szerkesztőt és az előnézetet, az előnézet követheti a szerkesztő görgetését. A `scrollSync()` két Svelte actiont és egy függvényt ad vissza:

```svelte
<script lang="ts">
	import { Editor, Preview, scrollSync, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';

	let value = $state<StoredBlock[]>([]);
	const sync = scrollSync();
</script>

<div class="split">
	<div class="pane" use:sync.source>
		<Editor bind:value plugins={PLUGINS} />
	</div>
	<div class="pane" use:sync.target>
		<Preview blocks={value} plugins={PLUGINS} />
	</div>
</div>

<style>
	.split {
		display: grid;
		grid-template-columns: 1fr 1fr;
		height: 100vh;
	}
	.pane {
		overflow-y: auto;
	}
</style>
```

- A `use:sync.source` a szerkesztő görgethető dobozára kerül, a `use:sync.target` az előnézetére. A cél a görgetési tartományának ugyanakkora hányadáig (0…1) görög, mint a forrás. A szinkron egyirányú: az előnézet görgetése semmi mást nem mozgat.
- Animációs képkockánként egyszer igazodik, amikor a forrás görög, és akkor is, amikor a céldoboz vagy a gyerekei mérete megváltozik. A `sync.align()` kérésre is igazít, például miután megváltozott az előnézet szélessége.
- A `use:sync.target={on}` egy logikai értéket kap (alapértéke `true`), ha az alkalmazás két doboz között váltogatja a célt, például egy asztali panel és egy telefonkeret között: a láthatót kapcsold be.
- A szinkron csak arányos: a két doboz nagyjából ugyanazt a helyet mutatja, nem pontosan ugyanazt a blokkot. Ez szándékos — nem kell hozzá semmilyen jelölés, és bármilyen előnézettel működik.

A `scrollFraction(box)` megmondja, mennyire van legörgetve egy doboz (0…1; 0, ha nem görgethető), a `setScrollFraction(box, f)` pedig odagörgeti — például hogy megmaradjon a hely, amikor az önmagában látható előnézet szélessége változik:

```ts
import { scrollFraction, setScrollFraction } from '@atom-forge/brickee';
import { tick } from 'svelte';

export async function keepPlace(box: HTMLElement, change: () => void) {
	const f = scrollFraction(box);
	change(); // pl. az előnézet szélességének váltása
	await tick();
	setScrollFraction(box, f);
}
```
