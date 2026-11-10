# Az alkalmazás kontextusai

[← Előző](writing-plugins.md) · [Tartalom](index.md) · [Következő →](server-side.md)

A szerkesztőnek nincsenek propjai az alkalmazás fogalmaihoz. Amit a befogadó alkalmazás tud — a képeit, az éppen mutatott oldalszélességet, a nyelvét —, az három Svelte-kontextuson keresztül jut el a pluginokhoz. Mindegyikhez tartozik egy `provide…` függvény, amelyet a szerkesztő vagy az előnézet fölötti komponens inicializálásakor hívsz meg, és egy `use…` függvény a plugin-komponensek számára.

| Kontextus | Megadás | Olvasás | Mit hordoz |
|---|---|---|---|
| Média | `media` prop, vagy `provideMedia(() => list)` | `useMedia()` | A képek, amelyek közül a blokkok választhatnak. |
| Nézet | `provideView(() => key)` | `useView()` | A nézet, amelyet a nézetenkénti mezők szerkesztenek. |
| Szöveg | `messages` prop, vagy `provideText(() => messages)` | `useText()` | Felületi szövegek az alkalmazás nyelvén. |

A beágyazott szerkesztők és előnézetek mindhármat a szülőjüktől öröklik.

## Média

A blokkok soha nem tárolnak kép-URL-t. A képmező egy `MediaItem` **azonosítóját** tárolja, a szerkesztő, az előnézet és a pluginok pedig a dokumentum médiájában keresik ki az elemet:

```ts
interface MediaItem {
	id: string; // a blokk propsában tárolva
	name: string; // fájlnév vagy cím, a választóban jelenik meg
	url: string; // a kép címe
	group?: string; // címsor a választóban (pl. a melléklet kategóriája)
}
```

A mellékelt pluginok nem használnak képeket; a képblokkokat neked kell megírnod, mert az elrendezésük az oldalé. Egy minimális `photo` plugin — képmező, alternatív szöveg és magasságcsúszka:

```svelte
<!-- PhotoView.svelte -->
<script lang="ts" module>
	export interface PhotoProps extends Record<string, unknown> {
		/** Egy MediaItem azonosítója. */
		image: string;
		alt: string;
		/** A magasság a szélesség %-ában (20–150), vagy beállítatlan a kép saját alakjához. */
		ratio?: unknown;
	}

	/** CSS aspect-ratio egy tárolt magasságból, vagy undefined. */
	export const aspect = (v: unknown) => {
		const n = Number(v);
		return n >= 20 && n <= 150 ? `100 / ${n}` : undefined;
	};
</script>

<script lang="ts">
	import { ImageIcon } from '@lucide/svelte';
	import { Empty, findMedia, useMedia, type PluginViewProps } from '@atom-forge/brickee';

	let { props = $bindable(), blocks = $bindable() }: PluginViewProps<PhotoProps> = $props();
	const media = useMedia();
	const item = $derived(findMedia(media(), props.image));
</script>

{#if item}
	<img src={item.url} alt={props.alt} style="max-width: 100%" />
{:else}
	<Empty icon={ImageIcon} text="Pick an image above" />
{/if}
```

```svelte
<!-- PhotoPreview.svelte -->
<script lang="ts">
	import { baseValue, findMedia, useMedia, type PluginPreviewProps } from '@atom-forge/brickee';
	import { aspect, type PhotoProps } from './PhotoView.svelte';

	let { props }: PluginPreviewProps<PhotoProps> = $props();
	const media = useMedia();
	const item = $derived(findMedia(media(), props.image));
</script>

{#if item}
	<img src={item.url} alt={props.alt ?? ''} style:aspect-ratio={aspect(baseValue(props.ratio))} />
{/if}

<style>
	img {
		width: 100%;
		object-fit: cover;
	}
</style>
```

```ts
// photo.ts
import { ImageIcon } from '@lucide/svelte';
import { findMedia, mdText, type BlockPlugin } from '@atom-forge/brickee';
import PhotoView, { type PhotoProps } from './PhotoView.svelte';
import PhotoPreview from './PhotoPreview.svelte';

export const photo: BlockPlugin<PhotoProps> = {
	type: 'photo',
	label: 'Photo',
	hint: 'One picked image',
	keys: 'photo image picture',
	icon: ImageIcon,
	props: () => ({ image: '', alt: '' }),
	fields: [
		{ key: 'image', label: 'Image', kind: 'image' },
		{ key: 'alt', label: 'Alt text', kind: 'text', placeholder: 'What the image shows' },
		{ key: 'ratio', label: 'Height', kind: 'slider', min: 20, max: 150, unit: '%', none: 'Original' }
	],
	tag: () => 'photo',
	content: 'none',
	markdown: (p, { media }) => {
		const url = findMedia(media, p.image)?.url;
		return url ? `![${mdText(p.alt)}](${url})` : '';
	},
	view: PhotoView,
	preview: PhotoPreview
};
```

A szerkesztőnek és az előnézetnek ugyanazt a médiát add:

```svelte
<script lang="ts">
	import { Editor, Preview, type MediaItem, type StoredBlock } from '@atom-forge/brickee';
	import { photo } from './photo';

	let { value = $bindable(), media }: { value: StoredBlock[]; media: MediaItem[] } = $props();
</script>

<Editor bind:value plugins={[photo]} {media} />
<Preview blocks={value} plugins={[photo]} {media} />
```

Plugin-komponensben a listát a `useMedia()`-val olvasd ki — függvényt ad vissza, így a lista mindig friss marad —, egy elemet pedig a `findMedia(list, id)`-vel keress meg, ahogy a photo nézete és előnézete is teszi.

> **Bélyegképek a szerkesztőben**
>
> A szerkesztőnek csak kis képekre van szüksége. Mivel a blokkok azonosítókat tárolnak, a szerkesztőnek adhatsz egy bélyegkép-URL-ekből álló listát, az oldalon lévő előnézetnek pedig egy teljes méretű URL-ekből állót, ugyanazokkal az azonosítókkal.

Tipikus forrás egy oldal feltöltött mellékletei vagy egy médiatár. Minden képnek, amelyre egy dokumentum hivatkozik, szerepelnie kell a listában, különben a blokkja semmit sem renderel.

## Nézetenkénti értékek

Egyes beállítások attól függnek, hogyan jelenik meg az oldal: egy képnek telefonon más képarány kellhet, mint széles képernyőn. A `views` beállítással rendelkező `slider` mező nézetenként tárol értéket:

```ts
import type { BlockPlugin } from '@atom-forge/brickee';
import { gap } from '@atom-forge/brickee/plugins';
import { photo } from './photo';

export const VIEWS = [
	{ key: 'desktop', label: 'Desktop' },
	{ key: 'tablet', label: 'Tablet' },
	{ key: 'phone', label: 'Phone' }
];

/** Ugyanaz a plugin, az egyik mezője nézetenként állítva. */
const perView = (plugin: BlockPlugin, key: string): BlockPlugin => ({
	...plugin,
	fields: plugin.fields?.map((f) => (f.key === key ? { ...f, views: VIEWS } : f))
});

export const plugins = [perView(photo, 'ratio'), perView(gap, 'lines')];
```

Hogy milyen nézetek léteznek, és melyik látszik éppen, az az alkalmazás dolga. Az alkalmazás a `provideView`-val közli a szerkesztővel az aktuális nézetet, jellemzően egy szerkesztő melletti szélességváltóból:

```svelte
<script lang="ts">
	import { Editor, provideView, type StoredBlock } from '@atom-forge/brickee';
	import { plugins } from './blocks';

	let { value = $bindable(), view }: { value: StoredBlock[]; view: string } = $props();
	provideView(() => view);
</script>

<Editor bind:value {plugins} />
```

Hogyan viselkednek az értékek:

- Az első nézet az **alap**. Minden további nézet, amíg nincs saját értéke, az előtte lévő nézet értékét veszi át; a mező ilyenkor örököltként jelölve mutatja az értéket.
- A mező az aktuális nézet értékét szerkeszti, és a saját címkéje mellett a nézet címkéjét is mutatja. `provideView` nélkül, vagy ha a kulcs nem szerepel a `views`-ban, az alapértéket szerkeszti.
- Tárolás: ha csak alapérték van → önmagában, egyszerű értékként tárolódik (`"ratio": "56"`); ha más nézeteknek saját értékük van → nézet szerint kulcsolt objektumként (`"ratio": { "desktop": "56", "phone": "100" }`). Azok a dokumentumok, amelyek még azelőtt íródtak, hogy egy mező nézetenkéntivé vált, érvényesek maradnak.

Az előnézet a `viewValues(value, keys)`-szel olvassa ki őket — minden nézet értékét, az öröklést alkalmazva —, vagy csak az alapértéket a `baseValue(value)`-val. A photo előnézetének ez a változata CSS-változókon keresztül szélességenként egy-egy képarányt ad a böngészőnek:

```svelte
<script lang="ts">
	import { findMedia, useMedia, viewValues, type PluginPreviewProps } from '@atom-forge/brickee';
	import { aspect, type PhotoProps } from './PhotoView.svelte';

	let { props }: PluginPreviewProps<PhotoProps> = $props();
	const media = useMedia();
	const item = $derived(findMedia(media(), props.image));
	// desktop, tablet, phone: mindegyikhez egy CSS aspect-ratio ('auto': a kép saját alakja)
	const r = $derived(viewValues(props.ratio, ['desktop', 'tablet', 'phone']).map((v) => aspect(v) ?? 'auto'));
</script>

{#if item}
	<img src={item.url} alt={props.alt ?? ''} style:--r-desktop={r[0]} style:--r-tablet={r[1]} style:--r-phone={r[2]} />
{/if}

<style>
	img {
		width: 100%;
		object-fit: cover;
		aspect-ratio: var(--r-phone);
	}
	@media (min-width: 640px) {
		img {
			aspect-ratio: var(--r-tablet);
		}
	}
	@media (min-width: 1024px) {
		img {
			aspect-ratio: var(--r-desktop);
		}
	}
</style>
```

> **Csak csúszkák**
>
> A `views` a `slider` mezőkön támogatott. A többi mezőfajta figyelmen kívül hagyja.

## Felületi szövegek

A szerkesztő és a pluginok angolul íródtak, és az angol szöveg a fordításának kulcsa. Add át a `messages`-t — egy objektumot, amely az angol szövegeket a te nyelvedre képezi le — a legfelső szintű szerkesztőnek és előnézetnek:

```svelte
<script lang="ts">
	import { Editor, type StoredBlock } from '@atom-forge/brickee';
	import { PLUGINS } from '@atom-forge/brickee/plugins';
	import { hu } from '@atom-forge/brickee/locales/hu';

	let value = $state<StoredBlock[]>([]);
</script>

<Editor bind:value plugins={PLUGINS} messages={hu} />
```

Az `@atom-forge/brickee/locales/hu` a `hu`-t exportálja: a szerkesztő és az összes mellékelt plugin magyar szövegeit. Bővítsd ki a saját pluginjaid és mezőid szövegeivel:

```ts
import type { Messages } from '@atom-forge/brickee';
import { hu } from '@atom-forge/brickee/locales/hu';

export const messages: Messages = {
	...hu,
	Button: 'Gomb',
	'A link as a button': 'Egy link gombként',
	Desktop: 'Asztali',
	Phone: 'Telefon'
};
```

Amit a szerkesztő magától lefordít:

- a beépített blokkok és a pluginok `label`, `hint` és `keys` értékeit (a perjeles menü az angol és a lefordított szavak között is keres);
- egy plugin `tag`-jének részeit, ` · `-nál darabolva;
- a mezők címkéit, helyőrzőit, az opciók címkéit, a `none` címkéket és a nézetcímkéket;
- az `Empty` szövegét és a szerkesztő saját felületét.

Azt a szöveget, amelyet egy plugin maga renderel — a nézetében vagy az előnézetében —, a `useText()`-en keresztül add ki:

```svelte
<script lang="ts">
	import { useText, type PluginPreviewProps } from '@atom-forge/brickee';

	let { props }: PluginPreviewProps = $props();
	const tr = useText();
</script>

<p>{tr('Map: {place}', { place: String(props.q ?? '') })}</p>
```

A `{name}` helyőrzőket a második argumentum tölti ki. Komponenseken kívül a `translator(messages)` ugyanilyen függvényt ad vissza. A `messages`-ből hiányzó szöveg angol marad.
