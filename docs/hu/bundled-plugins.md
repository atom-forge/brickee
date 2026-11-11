# Mellékelt pluginok

[← Előző](documents-and-markdown.md) · [Tartalom](index.md) · [Következő →](writing-plugins.md)

Az `@atom-forge/brickee/plugins` négy általános célú plugint tartalmaz. Kizárólag azzal készültek, amit a mag bármely plugin-szerzőnek exportál, így példaként is szolgálnak, és csak azokat veszed át, amelyekre szükséged van.

```ts
import { PLUGINS } from '@atom-forge/brickee/plugins'; // mind a négy
import { table, youtube } from '@atom-forge/brickee/plugins'; // vagy néhány
```

## A pluginok

| Export | `type` | Mezők | Markdown alak | Mi ez |
|---|---|---|---|---|
| `table` | `table` | fejléc és lábléc (a cellák helyben szerkeszthetők) | GFM-táblázat (egy beillesztett GFM-táblázatból ilyen lesz) | Inline formázott cellák sorai és oszlopai; egy cellába kattintva megjelennek a sora és oszlopa eszközei (beszúrás, törlés, igazítás), a sorokat és az oszlopokat a fogantyújuknál fogva húzhatod. A cella formázottan mutatja a szövegét; szerkesztéskor a markdown látszik, és a `Ctrl/Cmd` + `B`, `I`, `E`, `Shift+X`, `K` jelöli a kijelölt szöveget. Az első sor lehet fejléc, az utolsó lábléc. |
| `youtube` | `youtube` | videóhivatkozás vagy -azonosító, cím | hivatkozás | YouTube-videó, kattintásra betöltve; bármely YouTube-hivatkozásból csak a videó azonosítója marad meg. |
| `map` | `map` | hely vagy cím, nagyításcsúszka | hivatkozás | Egy hely vagy cím beágyazott Google Maps-térképe. |
| `gap` | `gap` | magasságcsúszka | nincs | Üres hely a blokkok között, 1–8 sor magas. |

Egyikük sem tartalmaz beágyazott blokkokat. A képblokkok, a dobozok és a többi tároló megjelenése és viselkedése alkalmazásonként más, ezért a csomag ezeket rád hagyja: a [Pluginok írása](writing-plugins.md) egy tárolót mutat be, [Az alkalmazás kontextusai](host-contexts.md) pedig egy képblokkot.

A pluginok mellett a belépési pont exportálja a props-típusaikat (`TableProps`, `YouTubeProps`, `MapProps`, `GapProps`) és az előnézeteik által használt segédfüggvényeket, amelyek saját előnézetek írásakor jól jönnek: `youtubeId` (videóazonosító bármely YouTube-hivatkozásból), `mapSrc` (egy hely beágyazási címe), `gapLines`, `GAP_LINES` és `GAP_MAX`, valamint a táblázatokhoz `tableHeads`, `rowHead`, `HEADS` és `square`.

## Képletek

Az `@atom-forge/brickee/math` tartalmazza a képlet-pluginokat, saját belépési pontban, mert kell hozzájuk a `temml` (opcionális peer függőség: `bun add temml`). A Temml a LaTeX-et MathML-lé alakítja, amelyet a böngészők natívan megjelenítenek, és szerveren is renderelhető.

| Export | Fajta | Tárolt alak | Markdown alak |
|---|---|---|---|
| `math` | blokkplugin | `{ tex }` | `$$…$$` blokk; a beillesztett `math` blokk lesz (`fromMath`) |
| `inlineMath` | inline plugin | `$…$` a szövegben | ugyanaz |

```ts
import { inlineMath, math } from '@atom-forge/brickee/math';
// <Editor bind:value plugins={[math]} inlinePlugins={[inlineMath]} />
// <Preview blocks={value} plugins={[math]} inlinePlugins={[inlineMath]} />
```

Az inline képlet a GitHub és az Obsidian szabályát követi: a dollárjelek belső oldalán nincs szóköz, a záró után nem jön számjegy, így a „$5 és $10” szöveg marad. A `$a^2$` és egy szóköz begépelése képletet csinál, a formázósáv a kijelölt szövegből készít egyet, kattintásra pedig szerkeszthető. A `tex(source, display)` ugyanígy rendereli a LaTeX-et a saját komponenseidhez.

## Előnézet felülírása

A plugin egyszerű objektum, így az átalakítása egy spread. A leggyakoribb változtatás az előnézet: a szerkesztőnézet a csomagé marad, az oldal pedig a saját komponenseddel rendereli a blokkot – így a szerkesztő előnézete és a közzétett oldal pontosan ugyanaz.

```ts
// blocks.ts
import type { BlockPlugin } from '@atom-forge/brickee';
import { gap, table, youtube } from '@atom-forge/brickee/plugins';
import SiteYouTube from './SiteYouTube.svelte';

const withPreview = (plugin: BlockPlugin, preview: BlockPlugin['preview']): BlockPlugin => ({ ...plugin, preview });

export const plugins: BlockPlugin[] = [withPreview(youtube, SiteYouTube), table, gap];
```

A helyettesítő előnézet ugyanazokat a propsokat kapja, mint az eredeti (`PluginPreviewProps`: `props`, `blocks`, `plugins`). Ez lejátszó beágyazása helyett egy bélyegképet mutat, amely a videóra hivatkozik:

```svelte
<!-- SiteYouTube.svelte -->
<script lang="ts">
	import type { PluginPreviewProps } from '@atom-forge/brickee';
	import { youtubeId, type YouTubeProps } from '@atom-forge/brickee/plugins';

	let { props }: PluginPreviewProps<YouTubeProps> = $props();
	// a props felhasználói bemenet: csak a jól formált videóazonosítót tartsd meg
	const id = $derived(youtubeId(String(props.id ?? '')));
</script>

{#if id.length === 11}
	<a class="video" href="https://www.youtube.com/watch?v={id}" target="_blank" rel="noopener noreferrer">
		<img src="https://img.youtube.com/vi/{id}/hqdefault.jpg" alt={props.title || 'YouTube video'} />
	</a>
{/if}
```

## Mezők hozzáadása

Az új beállítások új mezőket és új kezdő propsokat jelentenek. A plugin nézetén nem kell változtatni: a szerkesztő minden mezőt kirajzol a blokk tetején, az előnézeted pedig beolvassa az új propsokat.

```ts
import type { BlockPlugin } from '@atom-forge/brickee';
import { map } from '@atom-forge/brickee/plugins';
import SiteMap from './SiteMap.svelte';

export const siteMap: BlockPlugin = {
	...map,
	props: () => ({ ...map.props(), caption: '' }),
	fields: [...(map.fields ?? []), { key: 'caption', label: 'Caption', kind: 'text' }],
	preview: SiteMap
};
```

```svelte
<!-- SiteMap.svelte -->
<script lang="ts">
	import type { PluginPreviewProps } from '@atom-forge/brickee';
	import { mapSrc, type MapProps } from '@atom-forge/brickee/plugins';

	let { props }: PluginPreviewProps<MapProps> = $props();
	const src = $derived(mapSrc(props));
</script>

{#if src}
	<figure>
		<iframe title={props.q} {src} loading="lazy"></iframe>
		{#if props.caption}<figcaption>{props.caption}</figcaption>{/if}
	</figure>
{/if}
```

Ha a szerkesztő nem angol nyelvű, add hozzá az új mezőcímkéket a `messages`-hez (lásd [Felületi szövegek](host-contexts.md#felületi-szövegek)). Ha egy meglévő csúszkát nézetenkéntivé akarsz tenni, képezd le a `fields` tömböt, és adj hozzá `views`-t (lásd [Nézetenkénti értékek](host-contexts.md#nézetenkénti-értékek)).

> **Tartsd meg a típust**
>
> Felülíráskor tartsd meg a plugin `type` értékét: a tárolt dokumentumok típus szerint hivatkoznak a blokkokra. Egy új `type` új blokkot jelent, és a meglévő dokumentumok nem fogják megtalálni a blokkjaikat.
