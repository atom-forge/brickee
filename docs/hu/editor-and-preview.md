# A szerkesztő és az előnézet

[← Előző](getting-started.md) · [Tartalom](index.md) · [Következő →](documents-and-markdown.md)

## Az Editor propjai

| Prop | Típus | Alapérték | Jelentés |
|---|---|---|---|
| `value` | `StoredBlock[]` (bindable) | `[]` | A dokumentum. Minden változáskor visszaíródik; a kívülről lecserélt dokumentum újra betöltődik. |
| `plugins` | `BlockPlugin[]` | `[]` | A pluginblokkok, amelyeket ez a szerkesztő megjeleníthet és felkínálhat. |
| `palette` | `string[]` | minden beépített blokk, utána minden plugin | A perjeles menü által felkínált blokktípusok, ebben a sorrendben (lásd lent). |
| `media` | `MediaItem[]` | — | A képek, amelyek közül a blokkok választhatnak (lásd [Az alkalmazás kontextusai](host-contexts.md)). |
| `messages` | `Messages` | — | Felületi szövegek az alkalmazás nyelvén: angol szöveg → fordítás. |
| `readonly` | `boolean` | `false` | Szerkesztés nélkül mutatja a dokumentumot; a pluginmezők rejtve vannak. |
| `placeholder` | `string` | `Write something, or press '/' for blocks…` | Az üres blokk tippszövege. |
| `nested` | `boolean` | `false` | A beágyazott blokkokat tartalmazó pluginok állítják be a belső szerkesztőjükön; a befogadó alkalmazás soha nem állítja be. |

Az üres dokumentum egyetlen üres bekezdésként jelenik meg, így a szerkesztő által visszaírt érték a csatolás után soha nem üres tömb: legalább `[{ type: 'md:p', indent: 0, text: '' }]`. Az előnézet kihagyja az üres bekezdéseket.

## A Preview propjai

| Prop | Típus | Alapérték | Jelentés |
|---|---|---|---|
| `blocks` | `StoredBlock[]` | — | A megjelenítendő dokumentum. |
| `plugins` | `BlockPlugin[]` | — | A pluginok, amelyek előnézetei a pluginblokkokat renderelik. |
| `media` | `MediaItem[]` | — | A képek, amelyekre a blokkok azonosítóval hivatkoznak. |
| `messages` | `Messages` | — | Felületi szövegek az alkalmazás nyelvén. |
| `markGated` | `boolean` | `true` | Megjelöli a kapus blokk utáni blokkokat (lásd [Egyedi és kapus blokkok](writing-plugins.md#egyedi-és-kapus-blokkok)). |
| `nested` | `boolean` | `false` | A beágyazott blokkjaikat renderelő plugin-előnézetek állítják be. |

Az előnézet a beépített blokkokat sima HTML-ként rendereli (`p`, `h1`…`h6`, `ul`/`ol` beágyazott elemekkel, `blockquote`, `pre > code` `language-<lang>` osztállyal, `hr`), a pluginblokkokat pedig a pluginjuk `preview` komponensével. Az a blokk, amelynek típusához nincs plugin a `plugins` listában, vagy amelynek pluginjának nincs `preview`-ja, nem renderelődik.

Hogy használod-e egyáltalán a `Preview`-t, rajtad múlik: a szerkesztő nem függ tőle. Egy saját megjelenítővel dolgozó alkalmazás maga is renderelheti a tárolt blokkokat, és a pluginjai elhagyhatják a `preview`-t.

A legfelső szintű szerkesztőnek vagy előnézetnek átadott `media` és `messages` öröklődik minden alatta lévő beágyazott szerkesztőre, beágyazott előnézetre és pluginkomponensre.

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
| Szövegformázás | Jelölj ki szöveget az eszköztárhoz, vagy `Ctrl/Cmd` + `B` félkövér, `I` dőlt, `U` aláhúzott, `Shift+X` áthúzott, `E` kód, `K` link, `\` formázás eltávolítása. Az alsó és a felső index az eszköztáron érhető el. |
| Behúzás | `Tab` / `Shift+Tab` (legfeljebb 6 szint). |
| Sortörés | `Shift+Enter`; kódblokkban az `Enter` töri a sort, a `Shift+Enter` vagy a `Ctrl/Cmd+Enter` pedig új blokkot kezd. |
| Blokkok kijelölése | Kattints egy blokk fogantyújára, nyomj `Esc`-et egy blokkban, `Shift+↑/↓` a blokk szélén túl, vagy húzz szövegkijelölést több blokkon át. Üres blokkban a `Ctrl/Cmd+A` minden blokkot kijelöl. |
| Blokkok mozgatása | Húzd a fogantyút (beágyazott szerkesztőkbe be és onnan ki is), vagy `Ctrl/Cmd+Shift+↑/↓`. |
| Átalakítás | Kattints egy blokk vagy egy kijelölés fogantyújára az „Átalakítás” menühöz. |
| Másolás, kivágás | A kijelölt blokkok másolásakor a markdownjuk kerül a vágólapra (a pluginblokkok a markdown alakjukon keresztül). |
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
